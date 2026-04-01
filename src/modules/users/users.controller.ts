import { hash } from 'bcryptjs'
import { UsersService } from './users.service'
import { IdParamDto } from '@/common/dtos/id-param.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { ChangeUsernameDto } from './dto/change-username.dto'
import { ChangePasswordDto } from './dto/change-password.dto'
import { ListUsersQueryDto } from './dto/list-users-query.dto'
import { CreateUserRequestDto } from './dto/create-user-request.dto'
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'

@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() dto: CreateUserRequestDto) {
    return this.usersService.create({
      name: dto.name,
      username: dto.username,
      passwordHash: await hash(dto.password, 12),
      isActive: dto.isActive,
    })
  }

  @Get()
  list(@Query() query: ListUsersQueryDto) {
    return this.usersService.list(query)
  }

  @Get(':id')
  findOne(@Param() params: IdParamDto) {
    return this.usersService.findOne(params.id)
  }

  @Patch(':id')
  update(@Param() params: IdParamDto, @Body() dto: UpdateUserDto) {
    return this.usersService.update(params.id, dto)
  }

  @Post(':id/change-password')
  changePassword(@Param() params: IdParamDto, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(params.id, dto.password)
  }

  @Post(':id/change-username')
  changeUsername(@Param() params: IdParamDto, @Body() dto: ChangeUsernameDto) {
    return this.usersService.changeUsername(params.id, dto.username)
  }

  @Post(':id/freeze')
  freeze(@Param() params: IdParamDto) {
    return this.usersService.freeze(params.id)
  }

  @Post(':id/unfreeze')
  unfreeze(@Param() params: IdParamDto) {
    return this.usersService.unfreeze(params.id)
  }

  @Delete(':id')
  remove(@Param() params: IdParamDto) {
    return this.usersService.remove(params.id)
  }
}
