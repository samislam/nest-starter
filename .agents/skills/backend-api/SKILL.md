---
name: backend-api
description: Use when working inside a NestJS backend boilerplate that uses Nestia typed routes, zod DTOs, Prisma models/migrations, resource configs, pagination/search/sort/select utilities, custom HTTP exceptions, auth guards, generated SDK contracts, or backend scripts.
---

# Backend API Boilerplate

Use this skill for changes in a backend project built from this boilerplate, especially new modules,
controllers, services, DTOs, Prisma schema changes, Nestia SDK contracts, authentication behavior,
or shared backend utilities.

## Core Workflow

1. Read existing module patterns before editing. Established modules show the intended
   controller/service/config/DTO shape.
2. Keep modules feature-based under `src/modules/<feature>`.
3. Use Nestia typed decorators for route contracts.
4. Use zod schemas plus `createZodDto` for request body/query DTOs.
5. Use resource config helpers for list endpoints that support pagination, search, sort, and select.
6. Keep Prisma access inside services through `DatabaseService`.
7. If Prisma schema changes, add/update a migration and regenerate Prisma Client.
8. If controller contracts change, regenerate/build the Nestia SDK.
9. If routes are added, removed, or changed, update the Bruno collection under `http/bruno` so
   manual API requests stay in sync with the backend.
10. Verify with typecheck/build. Be aware `tsx` may need sandbox escalation in this environment.

## Module Shape

Default module layout:

```txt
src/modules/<feature>/
├── dto/
│   ├── create-<feature>.dto.ts
│   ├── update-<feature>.dto.ts
│   └── list-<feature>-query.dto.ts
├── <feature>.config.ts
├── <feature>.controller.ts
├── <feature>.module.ts
└── <feature>.service.ts
```

Register the module in `src/app.module.ts`.

## Controllers

- Use `@Controller({ path: '<resource>', version: '1' })`.
- Use `@n.TypedRoute.Get/Post/Patch/Delete`, `@n.TypedBody`, `@n.TypedQuery`,
  and `@n.TypedParam`.
- Public routes require `@Public()`; routes are protected by the global `JwtAuthGuard` by default.
- Prefer returning service calls directly.
- Add explicit return types when response contracts would otherwise be inferred poorly, especially
  Prisma relation payloads.

## Services

- Inject `DatabaseService`.
- Keep business logic and Prisma queries in services, not controllers.
- Use `ensureExists` helpers before update/delete when the service wants a clean 404.
- Use `@Catch(Error, (error, ctx) => ctx.errorClassifier(error))` around methods that need Prisma
  error mapping.
- In classifiers, handle known Prisma codes with `switch` and rethrow unknown errors.
- Use compact guard returns where possible.

## DTOs

- Define and export the zod schema.
- Export a DTO class with `createZodDto(schema)`.
- For update DTOs, prefer `createSchema.partial()`.
- For typed response contracts that Nestia should expose cleanly, use TypeScript interfaces/types in
  a `*.dto.ts` file.

## Resource Lists

For paginated resources:

- Define `<feature>ResourceConfig` with `createResourceConfig`.
- Use `getPaginationArgs(query)`.
- Build `where` from resource `search`, filters, and module-specific query fields.
- Use `$transaction([count, findMany])`.
- Return `buildPaginatedResponse({ data, total, page, perPage })`.
- Build scalar `select` with `buildPrismaSelect`.
- Build `orderBy` with `buildPrismaOrderBy`.

Read [references/resource-modules.md](references/resource-modules.md) before adding or changing a
resource module.

## Prisma And SDK

Read [references/prisma-and-sdk.md](references/prisma-and-sdk.md) before schema, migration, or SDK
contract changes.

Common commands from the backend project root:

```bash
pnpm prisma generate --schema src/database/schema.prisma
pnpm run build
pnpm run sdk:build
pnpm exec tsc --noEmit
```

`pnpm run lint` may inspect generated `packages/sdk/dist` after SDK generation; treat generated
dist lint noise separately from source errors.

## Errors

Read [references/errors-auth.md](references/errors-auth.md) when touching auth, guards, custom
exceptions, Prisma error classifiers, or public/protected route behavior.

## Avoid

- Do not bypass `DatabaseService`.
- Do not invent ad hoc pagination envelopes.
- Do not manually create frontend SDK types to compensate for missing backend contracts.
- Do not add broad abstractions before seeing a repeated pattern.
- Do not change generated files by hand.
