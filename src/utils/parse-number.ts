/**
 * Parse a number the way a person actually types it, rather than only what `parseFloat` accepts.
 *
 * The digit tables and separator rules are NOT hand-maintained: they are derived from `Intl`, which
 * is CLDR data already shipped with the runtime. That covers every positional numbering system the
 * platform knows — Arabic-Indic, Persian, Devanagari, Bengali, Thai, Myanmar and ~30 more — instead
 * of the two we would realistically hand-code, and it costs no dependency.
 *
 *     parseUserNumber('٢٠٠٠')            → 2000
 *     parseUserNumber('๑๒๓')             → 123
 *     parseUserNumber('1,234,567')       → 1234567
 *     parseUserNumber('1.234.567,89', 'de-DE') → 1234567.89
 *
 * Returns null when the input is not a number, so callers can show a "send a valid number" error.
 */

/** All decimal digits, in every positional numbering system, mapped to their value. Built once. */
let digitValues: Map<string, number> | null = null

const getDigitValues = (): Map<string, number> => {
  if (digitValues) return digitValues
  const map = new Map<string, number>()

  // `Intl.supportedValuesOf` is ES2022 and present on every runtime this targets, but it is not in
  // the configured TS lib — narrowed here rather than widening `lib` for the whole project. The
  // fallback covers a runtime old enough to lack it.
  const intl = Intl as typeof Intl & {
    supportedValuesOf?: (key: 'numberingSystem') => string[]
  }
  const systems =
    typeof intl.supportedValuesOf === 'function'
      ? intl.supportedValuesOf('numberingSystem')
      : ['latn', 'arab', 'arabext']

  for (const system of systems) {
    try {
      const format = new Intl.NumberFormat(`en-u-nu-${system}`, { useGrouping: false })
      const digits = Array.from({ length: 10 }, (_, value) => format.format(value))
      // Algorithmic systems (roman, hebrew, …) do not produce one character per digit — skip them:
      // they are not positional, so there is nothing sane to parse.
      if (digits.some((digit) => [...digit].length !== 1)) continue
      digits.forEach((digit, value) => map.set(digit, value))
    } catch {
      // An unsupported numbering system on this runtime. Ignore it rather than failing the lot.
    }
  }

  digitValues = map
  return map
}

/** Replaces every non-ASCII decimal digit with its ASCII equivalent. */
const toAsciiDigits = (input: string): string => {
  const values = getDigitValues()
  let out = ''
  for (const char of input) {
    const value = values.get(char)
    out += value === undefined ? char : String(value)
  }
  return out
}

/** The group and decimal separators a given locale actually uses, straight from Intl. */
const localeSeparators = (locale: string): { group: string; decimal: string } | null => {
  try {
    const parts = new Intl.NumberFormat(locale).formatToParts(12345.6)
    const group = parts.find((part) => part.type === 'group')?.value
    const decimal = parts.find((part) => part.type === 'decimal')?.value
    if (!group || !decimal) return null
    return { group, decimal }
  } catch {
    return null
  }
}

/**
 * Separators that are unambiguous whatever the locale, so they are honoured before any heuristic:
 * the Arabic decimal separator only ever means "decimal point", and the Arabic thousands separator
 * only ever means "group".
 */
const ALWAYS_DECIMAL = new Set(['٫'])
const ALWAYS_GROUP = new Set(['٬', '،', "'", ' ', ' ', ' ', ' '])

/** `.` and `,` — the pair whose meaning flips between locales. */
const AMBIGUOUS = ['.', ',']

/**
 * Works out which of `.` / `,` is the decimal point when the locale is unknown.
 *
 * - Both present → the LAST one is the decimal separator (`1.234,56` and `1,234.56` both work).
 * - One kind, appearing more than once → it is grouping (`1,234,567`).
 * - One kind, once, followed by exactly three digits → the genuinely ambiguous case: `1,500` is
 *   fifteen hundred to an English speaker and one-and-a-half to a German one. With no locale we fall
 *   back to the ASCII/English reading, which is ASYMMETRIC on purpose — `1,000` is a thousand and
 *   `1.000` is one, because that is how each form is overwhelmingly written in English. PASS A
 *   LOCALE if you need this decided properly.
 * - Otherwise → decimal (`1,5`, `1.5`, `1,25`).
 */
const inferDecimalSeparator = (input: string): string | null => {
  const present = AMBIGUOUS.filter((sep) => input.includes(sep))
  if (present.length === 0) return null

  if (present.length === 2) {
    return input.lastIndexOf('.') > input.lastIndexOf(',') ? '.' : ','
  }

  const separator = present[0]
  const occurrences = input.split(separator).length - 1
  if (occurrences > 1) return null

  const after = input.slice(input.indexOf(separator) + 1)
  if (!/^\d{3}$/.test(after)) return separator
  // Ambiguous: fall back to the English reading (see above).
  return separator === '.' ? '.' : null
}

/**
 * @param raw     What the user typed.
 * @param locale  Their locale, when you know it (e.g. `'de-DE'`). Given one, the separators are read
 *                from Intl and nothing is guessed — which is the only way `1,500` can be resolved
 *                correctly. Without one, {@link inferDecimalSeparator} applies.
 */
export const parseUserNumber = (raw: string, locale?: string): number | null => {
  if (typeof raw !== 'string') return null

  const text = toAsciiDigits(raw.trim())
  if (text === '') return null

  const decimalSeparator = locale
    ? (localeSeparators(locale)?.decimal ?? inferDecimalSeparator(text))
    : inferDecimalSeparator(text)

  let normalized = ''
  for (const char of text) {
    if (ALWAYS_GROUP.has(char)) continue
    if (ALWAYS_DECIMAL.has(char) || char === decimalSeparator) {
      normalized += '.'
      continue
    }
    // Any other separator character is grouping — drop it.
    if (AMBIGUOUS.includes(char)) continue
    normalized += char
  }

  const value = Number.parseFloat(normalized)
  return Number.isFinite(value) ? value : null
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
