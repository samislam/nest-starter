import { SetMetadata } from '@nestjs/common'

export const IS_PUBLIC_KEY = 'isPublic'

/**
 * Marks a route handler or controller as publicly accessible.
 *
 * Guards can read the `IS_PUBLIC_KEY` metadata to bypass authentication for
 * endpoints decorated with `@Public()`.
 *
 * @returns A metadata decorator that flags the target as public.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)
