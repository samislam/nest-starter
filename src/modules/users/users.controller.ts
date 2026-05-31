import { hash } from 'bcryptjs'
import * as n from '@nestia/core'
import { Controller } from '@nestjs/common'
import { UsersService } from './users.service'
import { UserDto } from './dto/user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { ListUsersResponseDto } from './dto/user.dto'
import { ChangeUsernameDto } from './dto/change-username.dto'
import { ChangePasswordDto } from './dto/change-password.dto'
import { ListUsersQueryDto } from './dto/list-users-query.dto'
import { CreateUserRequestDto } from './dto/create-user-request.dto'

@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @n.TypedRoute.Post()
  async create(@n.TypedBody() dto: CreateUserRequestDto): Promise<UserDto> {
    return this.usersService.create({
      name: dto.name,
      username: dto.username,
      passwordHash: await hash(dto.password, 12),
      isActive: dto.isActive,
    })
  }

  @n.TypedRoute.Get()
  list(@n.TypedQuery() query: ListUsersQueryDto): Promise<ListUsersResponseDto> {
    return this.usersService.list(query)
  }

  @n.TypedRoute.Get(':id')
  findOne(@n.TypedParam('id') id: string): Promise<UserDto> {
    return this.usersService.findOne(id)
  }

  @n.TypedRoute.Patch(':id')
  update(@n.TypedParam('id') id: string, @n.TypedBody() dto: UpdateUserDto): Promise<UserDto> {
    return this.usersService.update(id, dto)
  }

  @n.TypedRoute.Post(':id/change-password')
  changePassword(
    @n.TypedParam('id') id: string,
    @n.TypedBody() dto: ChangePasswordDto
  ): Promise<UserDto> {
    return this.usersService.changePassword(id, dto.password)
  }

  @n.TypedRoute.Post(':id/change-username')
  changeUsername(
    @n.TypedParam('id') id: string,
    @n.TypedBody() dto: ChangeUsernameDto
  ): Promise<UserDto> {
    return this.usersService.changeUsername(id, dto.username)
  }

  @n.TypedRoute.Post(':id/freeze')
  freeze(@n.TypedParam('id') id: string): Promise<UserDto> {
    return this.usersService.freeze(id)
  }

  @n.TypedRoute.Post(':id/unfreeze')
  unfreeze(@n.TypedParam('id') id: string): Promise<UserDto> {
    return this.usersService.unfreeze(id)
  }

  @n.TypedRoute.Delete(':id')
  remove(@n.TypedParam('id') id: string): Promise<UserDto> {
    return this.usersService.remove(id)
  }
}
