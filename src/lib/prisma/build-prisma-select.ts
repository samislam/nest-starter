/**
 * Builds a Prisma-compatible `select` object from a list of field names.
 *
 * @param fields  Input fields to include in selection.
 * @returns Prisma `select` object where each field is set to `true`.
 */
export function buildPrismaSelect<TField extends string, TSelect extends Record<string, unknown>>(
  fields: readonly TField[]
): TSelect {
  return fields.reduce<TSelect>((acc, field) => {
    ;(acc as Record<string, unknown>)[field] = true
    return acc
  }, {} as TSelect)
}
