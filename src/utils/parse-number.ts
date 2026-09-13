/**
 * Parse a number the way a person actually types it into the bot, not just what `parseFloat` accepts:
 *
 *   - Eastern digits:      ٢٠٠٠ / ۲۰۰۰                  → 2000   (Arabic-Indic & Persian)
 *   - thousands commas:    1,000 / 1,000,000 / 1٬000    → 1000 / 1000000 / 1000
 *   - a decimal point:     1.000, 1.001                 → 1, 1.001                  (unchanged)
 *
 * Returns null when the input isn't a number, so callers can show a "send a valid number" error.
 */

const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩'
const PERSIAN = '۰۱۲۳۴۵۶۷۸۹'

export const parseUserNumber = (raw: string): number | null => {
  if (typeof raw !== 'string') return null
  let s = raw.trim()

  // Eastern digits → ASCII.
  s = s
    .replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(PERSIAN.indexOf(d)))

  // Arabic decimal separator → '.', then drop thousands separators (ASCII comma, Arabic comma ،,
  // Arabic thousands ٬). Period stays the decimal point.
  s = s.replace(/٫/g, '.').replace(/[,،٬]/g, '')

  const n = Number.parseFloat(s)
  return Number.isFinite(n) ? n : null
}

/**
 * How many decimal places a number carries — used to reject over-precise input (e.g. a price with ten
 * decimals). Trailing zeros don't count (`1.50` → 1), because they cost the user nothing. Handles the
 * exponential form JS uses for very small numbers (`1e-7`) so those aren't mistaken for zero decimals.
 */
export const decimalPlaces = (value: number): number => {
  if (!Number.isFinite(value)) return 0
  const s = String(value)
  const eIndex = s.search(/[eE]/)
  if (eIndex !== -1) {
    const mantissa = s.slice(0, eIndex)
    const exponent = Number(s.slice(eIndex + 1))
    const mantissaDecimals = mantissa.includes('.') ? mantissa.split('.')[1].length : 0
    return Math.max(0, mantissaDecimals - exponent)
  }
  const dot = s.indexOf('.')
  return dot === -1 ? 0 : s.length - dot - 1
}
