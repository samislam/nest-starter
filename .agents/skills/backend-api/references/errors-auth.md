# Errors And Auth

Use this reference when touching custom exceptions, Prisma error classifiers, guards, or public API
routes.

## Auth Defaults

- `JwtAuthGuard` is registered globally in `src/app.module.ts`.
- Routes are protected by default.
- Use `@Public()` from `src/common/decorators/public.decorator.ts` for public endpoints.
- Use `@CurrentUser()` from `src/common/decorators/current-user.decorator.ts` to access JWT user
  payloads in protected controllers.

## Custom Exceptions

Existing classes live in `src/classes`:

- `DuplicateHttpException` maps duplicate-field errors to `DUPLICATE_ERR`.
- `ReferenceHttpException` maps reference errors to `REF_ERR`.
- Auth exceptions map login and account-state failures.

Prefer existing exception classes over raw object responses when the error shape is shared.

## Prisma Error Classifiers

For service methods that need custom error mapping:

```ts
@Catch(Error, (error: Error, ctx: ItemsService) => ctx.errorClassifier(error))
async create(dto: CreateItemDto) {
  // ...
}
```

Classifier pattern:

```ts
private errorClassifier(error: Error): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case PRISMA_DUPLICATE_ERR:
        throw new DuplicateHttpException(['name'], 'Item already exists')
      case PRISMA_NOT_FOUND_ERR:
        throw new NotFoundException('Related resource not found')
      default:
        throw error
    }
  }

  throw error
}
```

Useful constants live in `src/constants.ts`:

- `PRISMA_DUPLICATE_ERR` is `P2002`.
- `PRISMA_NOT_FOUND_ERR` is `P2025`.
- `PRISMA_REF_ERR` is `P2003`.

## Nestia Typed Exceptions

When an endpoint has an intentional documented error response, add `@n.TypedException<T>()` in the
controller. Existing auth routes show this pattern.

```ts
@n.TypedException<DuplicateExceptionResponse>({
  status: HttpStatus.BAD_REQUEST,
  description: 'Name already exists',
})
```

Do not wrap every controller handler in `try/catch`; let service exceptions propagate unless the
controller needs to transform the contract.
