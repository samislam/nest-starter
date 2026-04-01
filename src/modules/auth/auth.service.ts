import Catch from 'catch-decorator'
import { compare, hash } from 'bcryptjs'
import { JwtService } from '@nestjs/jwt'
import { LoginDto } from './dto/login.dto'
import { Prisma } from '@/generated/prisma'
import { Injectable } from '@nestjs/common'
import { RegisterDto } from './dto/register.dto'
import { PRISMA_DUPLICATE_ERR } from '@/constants'
import { UsersService } from '../users/users.service'
import { AccountForzenHttpException } from '@/classes/auth-exception.class'
import { DuplicateHttpException } from '@/classes/duplicate-exception.class'
import { InvalidCredentialsHttpException } from '@/classes/auth-exception.class'

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService
  ) {}

  @Catch(Error, (error: Error, ctx: AuthService) => ctx.errorClassifier(error))
  async register(dto: RegisterDto) {
    const passwordHash = await hash(dto.password, 12)
    const user = await this.usersService.create({
      name: dto.name,
      username: dto.username,
      passwordHash,
    })

    return this.buildAuthResponse(user)
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByUsername(dto.username, true)
    if (!user) throw new InvalidCredentialsHttpException()
    if (!user.isActive) throw new AccountForzenHttpException()
    const isValid = await compare(dto.password, user.passwordHash)
    if (!isValid) throw new InvalidCredentialsHttpException()
    return this.buildAuthResponse(user)
  }

  private async buildAuthResponse(user: {
    id: string
    name: string
    username: string
    [key: string]: unknown
  }) {
    const { passwordHash: _passwordHash, ...safeUser } = user
    const accessToken = await this.jwtService.signAsync({
      sub: safeUser.id,
      name: safeUser.name,
      username: safeUser.username,
    })

    return {
      user: safeUser,
      accessToken,
    }
  }

  private errorClassifier(error: Error): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case PRISMA_DUPLICATE_ERR:
          throw new DuplicateHttpException(['username'], 'Username already exists')

        default:
          throw error
      }
    }

    throw error
  }
}
