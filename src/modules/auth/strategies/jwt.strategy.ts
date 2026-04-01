import { ConfigService } from '@nestjs/config'
import { JwtUser } from '../types/jwt-user.type'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { Environment } from '@/server/environment-schema'
import { UsersService } from '@/modules/users/users.service'
import { Injectable, UnauthorizedException } from '@nestjs/common'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService<Environment, true>,
    private readonly usersService: UsersService
  ) {
    super({
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('JWT_SECRET'),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    })
  }

  async validate(payload: JwtUser) {
    const user = await this.usersService.findActiveById(payload.sub)
    if (!user) throw new UnauthorizedException('User is no longer active')

    return {
      sub: user.id,
      name: user.name,
      username: user.username,
    } satisfies JwtUser
  }
}
