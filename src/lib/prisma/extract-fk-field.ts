/**
 * Extracts a foreign key field name from a Prisma constraint (e.g., FK_Product_Service →
 * serviceId). Falls back gracefully if pattern doesn't match.
 *
 * @param constraint  - The constraint name (e.g., 'FK_Product_Service')
 * @param fkPrefix    - Optional prefix to strip (default: 'FK_Product_')
 * @returns - E.g., 'serviceId' or undefined.
 */
export function extractFkFieldFromConstraint(
  constraint: string,
  fkPrefix: string
): string | undefined {
  if (!constraint.startsWith(fkPrefix)) return undefined

  const field = constraint.replace(fkPrefix, '').replace(/^[A-Z]/, (c) => c.toLowerCase())

  return field ? `${field}Id` : undefined
}
