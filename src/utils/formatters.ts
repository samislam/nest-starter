/**
 * Formats a number for display with grouping and at most `maxFractionDigits` decimals, trimming
 * trailing zeros (e.g. `498.50448654` → `498.5`, `498.001` → `498`, `1234` → `1,234`).
 *
 * Use {@link formatAmount} for money/crypto amounts (2 decimals) and {@link formatPrice} for exchange
 * rates (more precision, so small rates like `1.003` aren't rounded away).
 */
export const formatNumber = (value: number, maxFractionDigits = 2): string =>
  value.toLocaleString('en-US', { maximumFractionDigits: maxFractionDigits })

export const formatAmount = (value: number): string => formatNumber(value, 2)
export const formatPrice = (value: number): string => formatNumber(value, 8)
