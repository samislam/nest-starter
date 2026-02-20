/**
 * Dynamically constructs a Prisma `include` object based on allowed fields.
 *
 * @param populate - List of fields requested by the client
 * @param allowedFields - Whitelist of allowed relation fields (e.g. ['supplier', 'service'])
 * @returns - Prisma include object
 */
export function populatePrisma<T extends string>(
  populate: string[] = [],
  allowedFields: readonly T[]
): Record<T, true> {
  const include = {} as Record<T, true>

  for (const field of populate) {
    if (allowedFields.includes(field as T)) {
      include[field as T] = true
    }
  }

  return include
}
