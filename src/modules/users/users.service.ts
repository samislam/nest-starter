import { hash } from 'bcryptjs'
import { SafeUser } from './user-types'
import { Prisma, User } from '@/generated/prisma'
import { usersResourceConfig } from './users.config'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { DatabaseService } from '@/database/database.service'
import { Injectable, NotFoundException } from '@nestjs/common'
import { ListUsersQueryDto } from './dto/list-users-query.dto'
import { buildPrismaSelect } from '@/lib/prisma/build-prisma-select'
import { buildPrismaOrderBy } from '@/lib/prisma/build-prisma-order-by'
import { DuplicateHttpException } from '@/classes/duplicate-exception.class'
import { buildPaginatedResponse, getPaginationArgs } from '@/common/utils/pagination-helpers'

@Injectable()
export class UsersService {
  constructor(private readonly database: DatabaseService) {}

  async create(dto: CreateUserDto) {
    const selectedFields = usersResourceConfig.getSelectArgs({})

    return this.database.user.create({
      data: {
        name: dto.name,
        username: dto.username.toLowerCase(),
        passwordHash: dto.passwordHash,
        isActive: dto.isActive ?? true,
      },
      select: buildPrismaSelect<Prisma.UserScalarFieldEnum, Prisma.UserSelect>(selectedFields),
    })
  }

  async list(query: ListUsersQueryDto) {
    const { page, perPage, skip, take } = getPaginationArgs(query)
    const { sortBy, sortOrder, search, select } = query
    const selectedFields = usersResourceConfig.getSelectArgs({ select })
    const sortArgs = usersResourceConfig.getSortArgs({ sortBy, sortOrder })
    const where: Prisma.UserWhereInput = {
      ...usersResourceConfig.search(search),
      isActive: query.isActive,
    }

    const [total, data] = await this.database.$transaction([
      this.database.user.count({ where }),
      this.database.user.findMany({
        where,
        skip,
        take,
        orderBy: buildPrismaOrderBy<
          Prisma.UserScalarFieldEnum,
          Prisma.UserOrderByWithRelationInput
        >(sortArgs),
        select: buildPrismaSelect<Prisma.UserScalarFieldEnum, Prisma.UserSelect>(selectedFields),
      }),
    ])

    return buildPaginatedResponse({ data, total, page, perPage })
  }

  async findOne(id: string) {
    const selectedFields = usersResourceConfig.getSelectArgs({})
    const user = await this.database.user.findUnique({
      where: { id },
      select: buildPrismaSelect<Prisma.UserScalarFieldEnum, Prisma.UserSelect>(selectedFields),
    })
    if (!user) throw new NotFoundException('User not found')
    return user
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.ensureExists(id)
    const selectedFields = usersResourceConfig.getSelectArgs({})

    return this.database.user.update({
      where: { id },
      data: {
        name: dto.name,
      },
      select: buildPrismaSelect<Prisma.UserScalarFieldEnum, Prisma.UserSelect>(selectedFields),
    })
  }

  async changePassword(id: string, password: string) {
    await this.ensureExists(id)
    const selectedFields = usersResourceConfig.getSelectArgs({})

    return this.database.user.update({
      where: { id },
      data: {
        passwordHash: await hash(password, 12),
      },
      select: buildPrismaSelect<Prisma.UserScalarFieldEnum, Prisma.UserSelect>(selectedFields),
    })
  }

  async changeUsername(id: string, username: string) {
    await this.ensureExists(id)
    const normalizedUsername = username.toLowerCase()
    const existingUser = await this.database.user.findUnique({
      where: { username: normalizedUsername },
      select: { id: true },
    })

    if (existingUser && existingUser.id !== id) {
      throw new DuplicateHttpException(['username'], 'Username already exists')
    }

    const selectedFields = usersResourceConfig.getSelectArgs({})

    return this.database.user.update({
      where: { id },
      data: {
        username: normalizedUsername,
      },
      select: buildPrismaSelect<Prisma.UserScalarFieldEnum, Prisma.UserSelect>(selectedFields),
    })
  }

  async freeze(id: string) {
    return this.updateActiveStatus(id, false)
  }

  async unfreeze(id: string) {
    return this.updateActiveStatus(id, true)
  }

  async remove(id: string) {
    await this.ensureExists(id)
    const selectedFields = usersResourceConfig.getSelectArgs({})

    return this.database.user.delete({
      where: { id },
      select: buildPrismaSelect<Prisma.UserScalarFieldEnum, Prisma.UserSelect>(selectedFields),
    })
  }

  findByUsername(username: string, withPasswordHash: true): Promise<User | null>
  findByUsername(username: string, withPasswordHash?: false): Promise<SafeUser | null>
  findByUsername(username: string, withPasswordHash = false) {
    return this.database.user.findUnique({
      where: { username: username.toLowerCase() },
      omit: { passwordHash: !withPasswordHash },
    })
  }

  findActiveById(id: string) {
    return this.database.user.findFirst({
      where: { id, isActive: true },
    })
  }

  private async ensureExists(id: string) {
    const user = await this.database.user.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!user) {
      throw new NotFoundException('User not found')
    }
  }

  private async updateActiveStatus(id: string, isActive: boolean) {
    await this.ensureExists(id)
    const selectedFields = usersResourceConfig.getSelectArgs({})

    return this.database.user.update({
      where: { id },
      data: { isActive },
      select: buildPrismaSelect<Prisma.UserScalarFieldEnum, Prisma.UserSelect>(selectedFields),
    })
  }
}
