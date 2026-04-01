import { JwtUser } from '@/modules/auth/types/jwt-user.type'
import { createParamDecorator, ExecutionContext } from '@nestjs/common'

/**
 * Retrieves the authenticated user, or a specific property from that user,
 * from the current HTTP request.
 *
 * Use without arguments to inject the full `JwtUser`, or pass a `JwtUser` key
 * to inject only that field.
 *
 * @param data Optional user property name to select from the authenticated user.
 * @param ctx The NestJS execution context for the current request.
 * @returns The full authenticated user object, the selected user property, or `undefined` when no user is attached.
 */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: JwtUser }>()
    const user = request.user
    return data ? user?.[data] : user
  }
)
