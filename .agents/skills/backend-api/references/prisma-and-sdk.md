# Prisma And Nestia SDK

Use this reference when changing database schema, migrations, generated Prisma Client, or generated
SDK contracts.

## Prisma Schema

- Schema lives in `src/database/schema.prisma`.
- Generated Prisma client output is `src/generated/prisma`.
- `DatabaseService` extends the generated `PrismaClient` and is the access point for services.
- Prisma-generated files are not edited manually.

## Migrations

Existing migrations live under `src/database/migrations/<timestamp_name>/migration.sql`.

When adding models:

1. Update `src/database/schema.prisma`.
2. Add a migration SQL file under `src/database/migrations`.
3. Regenerate Prisma Client.

In this repo, migration files may be created manually when no DB connection should be touched.
Do not apply migrations to a database unless the user asks.

## Relations

- Use real Prisma relations when one entity owns or references another entity.
- For many-to-many, prefer Prisma implicit join tables unless extra join metadata is needed.
- Request DTOs should usually connect relations by IDs, for example `categoryIds: string[]`.
- In services, use nested Prisma writes:

```ts
categories: {
  connect: dto.categoryIds.map((id) => ({ id })),
}
```

For update:

```ts
categories: dto.categoryIds
  ? {
      set: dto.categoryIds.map((categoryId) => ({ id: categoryId })),
    }
  : undefined
```

If a relation ID does not exist, Prisma can throw `P2025`; map that in the service classifier when a
clear API error is needed.

## Generated SDK

Nestia config lives in `src/lib/nestia/nestia.config.ts`.

Generated source goes to `src/generated/nestia`; SDK package output is compiled under
`packages/sdk/dist`.

Regenerate after controller or DTO contract changes:

```bash
pnpm run sdk:build
```

The generated SDK uses path accessors based on route names. For example, `/inventory-items`
becomes `inventory_items` in the generated functional API.

## Validation Commands

From the backend project root:

```bash
pnpm prisma generate --schema src/database/schema.prisma
pnpm run build
pnpm run sdk:build
pnpm exec tsc --noEmit
```

`pnpm run lint` typechecks first, then runs ESLint. After SDK generation, ESLint may lint generated
CommonJS files in `packages/sdk/dist`; this is generated artifact noise unless source files are also
reported.

In this environment, commands that run `tsx` may fail in the sandbox with an IPC pipe `EPERM`. Rerun
important Prisma/build/SDK commands with escalation when that happens.
