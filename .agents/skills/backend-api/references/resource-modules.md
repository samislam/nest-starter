# Resource Module Patterns

Use this reference when adding or modifying CRUD-like API modules.

## Files

```txt
src/modules/<resource>/
├── dto/
│   ├── create-<resource>.dto.ts
│   ├── update-<resource>.dto.ts
│   ├── list-<resource>-query.dto.ts
│   └── <resource>.dto.ts             # optional response DTOs
├── <resource>.config.ts
├── <resource>.controller.ts
├── <resource>.module.ts
└── <resource>.service.ts
```

## DTOs

Request DTO example:

```ts
import { z } from 'zod'
import { createZodDto } from 'nestjs-zod'

export const createItemSchema = z.object({
  name: z.string().trim().min(1),
  isActive: z.boolean().optional(),
})

export class CreateItemDto extends createZodDto(createItemSchema) {}
```

Update DTO:

```ts
import { createZodDto } from 'nestjs-zod'
import { createItemSchema } from './create-item.dto'

export const updateItemSchema = createItemSchema.partial()

export class UpdateItemDto extends createZodDto(updateItemSchema) {}
```

List query DTO:

```ts
import { z } from 'zod'
import { createZodDto } from 'nestjs-zod'
import { paginationQuerySchema } from '@/common/dtos/pagination-query.dto'

export const listItemsQuerySchema = paginationQuerySchema.extend({
  isActive: z.boolean().optional(),
})

export class ListItemsQueryDto extends createZodDto(listItemsQuerySchema) {}
```

## Resource Config

Use `createResourceConfig` to whitelist client-driven sorting and selecting.

```ts
export const itemsResourceConfig = createResourceConfig<
  Prisma.ItemScalarFieldEnum,
  Prisma.ItemWhereInput
>({
  allowedSortBy: ['id', 'name', 'isActive', 'createdAt', 'updatedAt'],
  allowedSelect: ['id', 'name', 'isActive', 'createdAt', 'updatedAt'],
  defaultSelect: ['id', 'name', 'isActive', 'createdAt', 'updatedAt'],
  enforcedSelect: ['id'],
  defaultSortBy: 'createdAt',
  defaultSortOrder: 'desc',
  tieBreakerField: 'id',
  tieBreakerOrder: 'asc',
  search: (searchStr?: string) =>
    searchStr ? { OR: [{ name: { contains: searchStr, mode: 'insensitive' } }] } : undefined,
})
```

Do not include Prisma relation fields in `allowedSelect`; it is for scalar fields. Add relation
selects manually in the service or define explicit response DTOs.

## Controller

```ts
@Controller({ path: 'items', version: '1' })
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @n.TypedRoute.Post()
  create(@n.TypedBody() dto: CreateItemDto) {
    return this.itemsService.create(dto)
  }

  @n.TypedRoute.Get()
  list(@n.TypedQuery() query: ListItemsQueryDto) {
    return this.itemsService.list(query)
  }

  @n.TypedRoute.Get(':id')
  findOne(@n.TypedParam('id') id: string) {
    return this.itemsService.findOne(id)
  }

  @n.TypedRoute.Patch(':id')
  update(@n.TypedParam('id') id: string, @n.TypedBody() dto: UpdateItemDto) {
    return this.itemsService.update(id, dto)
  }
}
```

Add explicit return types when Nestia infers noisy Prisma relation payloads.

## Service List Pattern

```ts
async list(query: ListItemsQueryDto) {
  const { page, perPage, skip, take } = getPaginationArgs(query)
  const { sortBy, sortOrder, search, select } = query
  const selectedFields = itemsResourceConfig.getSelectArgs({ select })
  const sortArgs = itemsResourceConfig.getSortArgs({ sortBy, sortOrder })
  const where: Prisma.ItemWhereInput = {
    ...itemsResourceConfig.search(search),
    isActive: query.isActive,
  }

  const [total, data] = await this.database.$transaction([
    this.database.item.count({ where }),
    this.database.item.findMany({
      where,
      skip,
      take,
      orderBy: buildPrismaOrderBy<Prisma.ItemScalarFieldEnum, Prisma.ItemOrderByWithRelationInput>(
        sortArgs
      ),
      select: buildPrismaSelect<Prisma.ItemScalarFieldEnum, Prisma.ItemSelect>(selectedFields),
    }),
  ])

  return buildPaginatedResponse({ data, total, page, perPage })
}
```

## Enable/Disable

For active resources, prefer `isActive` and endpoints:

```txt
POST /api/v1/<resource>/:id/enable
POST /api/v1/<resource>/:id/disable
```

Implement them through a private `updateActiveStatus(id, isActive)` helper.

## Bruno Collections

When a resource module adds or changes endpoints, update the Bruno collection in `http/bruno` in
the same change. Keep folder names, request names, paths, auth, path params, and example bodies
aligned with the actual controller contracts so manual testing stays trustworthy.
