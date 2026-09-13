import * as n from '@nestia/core'
import { Throttle } from '@nestjs/throttler'
import { LoginDto } from './dto/login.dto'
import { AuthService } from './auth.service'
import { JwtUser } from './types/jwt-user.type'
import { RegisterDto } from './dto/register.dto'
import { AuthResponseDto } from './dto/auth-response.dto'
import { Public } from '@/common/decorators/public.decorator'
import { AuthMeResponseDto } from './dto/auth-me-response.dto'
import { Controller, HttpCode, HttpStatus } from '@nestjs/common'
import { AuthExceptionResponse } from '@/classes/auth-exception.class'
import { CurrentUser } from '@/common/decorators/current-user.decorator'
import { DuplicateExceptionResponse } from '@/classes/duplicate-exception.class'

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Tight limits on the unauthenticated routes: these are the only ones an anonymous caller can hit
  // in volume, and bcrypt is the sole other barrier against password brute-force.
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Public()
  @n.TypedRoute.Post('register')
  @n.TypedException<DuplicateExceptionResponse>({
    status: HttpStatus.BAD_REQUEST,
    description: 'Username already exists',
  })
  register(@n.TypedBody() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto)
  }

  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Public()
  @n.TypedRoute.Post('login')
  @HttpCode(HttpStatus.OK)
  @n.TypedException<AuthExceptionResponse>({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials',
  })
  @n.TypedException<AuthExceptionResponse>({
    status: HttpStatus.FORBIDDEN,
    description: 'Account is frozen',
  })
  login(@n.TypedBody() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto)
  }

  @n.TypedRoute.Get(['me', 'whoami'])
  me(@CurrentUser() user: JwtUser): AuthMeResponseDto {
    return { user }
  }
}
