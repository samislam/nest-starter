import { LoginDto } from './dto/login.dto'
import { AuthService } from './auth.service'
import { JwtUser } from './types/jwt-user.type'
import { RegisterDto } from './dto/register.dto'
import { Public } from '@/common/decorators/public.decorator'
import { CurrentUser } from '@/common/decorators/current-user.decorator'
import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common'

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto)
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto)
  }

  @Get(['me', 'whoami'])
  me(@CurrentUser() user: JwtUser) {
    return { user }
  }
}
