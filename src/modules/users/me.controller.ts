import * as n from '@nestia/core'
import { Controller } from '@nestjs/common'
import { UsersService } from './users.service'
import { JwtUser } from '../auth/types/jwt-user.type'
import { UpdateUserDto } from './dto/update-user.dto'
import { ChangePasswordDto } from './dto/change-password.dto'
import { ChangeUsernameDto } from './dto/change-username.dto'
import { CurrentUser } from '@/common/decorators/current-user.decorator'

@Controller({ path: 'me', version: '1' })
export class MeController {
  constructor(private readonly usersService: UsersService) {}

  @n.TypedRoute.Get()
  findMe(@CurrentUser() user: JwtUser) {
    return this.usersService.findOne(user.sub)
  }

  @n.TypedRoute.Patch()
  updateMe(@CurrentUser() user: JwtUser, @n.TypedBody() dto: UpdateUserDto) {
    return this.usersService.update(user.sub, dto)
  }

  @n.TypedRoute.Post('change-password')
  changeMyPassword(@CurrentUser() user: JwtUser, @n.TypedBody() dto: ChangePasswordDto) {
    return this.usersService.changePassword(user.sub, dto.password)
  }

  @n.TypedRoute.Post('change-username')
  changeMyUsername(@CurrentUser() user: JwtUser, @n.TypedBody() dto: ChangeUsernameDto) {
    return this.usersService.changeUsername(user.sub, dto.username)
  }
}
