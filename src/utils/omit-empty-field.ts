/**
 * Converts blank string input to `undefined` while leaving all other values unchanged.
 *
 * Useful for update payloads where empty form fields should be omitted instead of
 * being treated as intentional string values.
 *
 * @param value The value to normalize.
 * @returns `undefined` when `value` is a string containing only whitespace; otherwise returns `value`.
 */
export const omitEmptyField = (value: unknown) => {
  return typeof value === 'string' && value.trim() === '' ? undefined : value
}
