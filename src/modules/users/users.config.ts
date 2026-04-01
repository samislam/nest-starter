import { Prisma } from '@/generated/prisma'
import { createResourceConfig } from '@/common/utils/create-resource-config'

export const usersResourceConfig = createResourceConfig<
  Prisma.UserScalarFieldEnum,
  Prisma.UserWhereInput
>({
  allowedSortBy: ['id', 'name', 'username', 'isActive', 'createdAt', 'updatedAt'],
  allowedSelect: ['id', 'name', 'username', 'isActive', 'createdAt', 'updatedAt'],
  defaultSelect: ['id', 'name', 'username', 'isActive', 'createdAt', 'updatedAt'],
  enforcedSelect: ['id'],
  defaultSortBy: 'createdAt',
  defaultSortOrder: 'desc',
  tieBreakerField: 'id',
  tieBreakerOrder: 'asc',
  search: (searchStr?: string) =>
    searchStr
      ? {
          OR: [
            { name: { contains: searchStr, mode: 'insensitive' } },
            { username: { contains: searchStr.toLowerCase(), mode: 'insensitive' } },
          ],
        }
      : undefined,
})
