import { parseUserNumber } from './parse-number'

describe('parseUserNumber', () => {
  it('parses plain numbers and decimals (period is the decimal point)', () => {
    expect(parseUserNumber('1000')).toBe(1000)
    expect(parseUserNumber('1.000')).toBe(1)
    expect(parseUserNumber('1.001')).toBe(1.001)
    expect(parseUserNumber(' 42 ')).toBe(42)
    expect(parseUserNumber('0')).toBe(0)
  })

  it('treats commas as thousands separators', () => {
    expect(parseUserNumber('1,000')).toBe(1000)
    expect(parseUserNumber('1,000,000')).toBe(1000000)
    expect(parseUserNumber('20,500')).toBe(20500)
  })

  it('does NOT treat letter suffixes (k/m/b) as multipliers', () => {
    // parseFloat stops at the letter → the leading number, not thousands/millions.
    expect(parseUserNumber('1k')).toBe(1)
    expect(parseUserNumber('9k')).toBe(9)
    expect(parseUserNumber('1m')).toBe(1)
    expect(parseUserNumber('1b')).toBe(1)
  })

  it('normalises digits from every numbering system Intl knows, not a hand-written list', () => {
    expect(parseUserNumber('٢٠٠٠')).toBe(2000) // Arabic-Indic
    expect(parseUserNumber('۱۵')).toBe(15) // Persian
    expect(parseUserNumber('١٬٠٠٠')).toBe(1000) // Arabic thousands separator
    expect(parseUserNumber('٣٫٥')).toBe(3.5) // Arabic decimal separator
    expect(parseUserNumber('१२३')).toBe(123) // Devanagari — never hand-coded
    expect(parseUserNumber('১২৩')).toBe(123) // Bengali
    expect(parseUserNumber('๑๒๓')).toBe(123) // Thai
  })

  it('reads a comma decimal as a decimal, not as grouping', () => {
    // The old implementation stripped every comma, so '1,5' parsed as 15 — an order of magnitude
    // wrong for anyone in a comma-decimal locale, which is most of Europe and the Arab world.
    expect(parseUserNumber('1,5')).toBe(1.5)
    expect(parseUserNumber('0,75')).toBe(0.75)
    expect(parseUserNumber('1,25')).toBe(1.25)
  })

  it('uses the last separator as the decimal point when both appear', () => {
    expect(parseUserNumber('1.234,56')).toBe(1234.56) // de-DE style
    expect(parseUserNumber('1,234.56')).toBe(1234.56) // en-US style
    expect(parseUserNumber('1.234.567,89')).toBe(1234567.89)
  })

  it('resolves the ambiguous 3-digit case from the locale when one is given', () => {
    // '1,500' is fifteen hundred in en-US and one-and-a-half in de-DE. Only a locale can settle it.
    expect(parseUserNumber('1,500', 'en-US')).toBe(1500)
    expect(parseUserNumber('1,500', 'de-DE')).toBe(1.5)
    expect(parseUserNumber('1.500', 'de-DE')).toBe(1500)
    expect(parseUserNumber('1.500', 'en-US')).toBe(1.5)
  })

  it('without a locale, treats a single 3-digit group as grouping', () => {
    // Documented, deliberate: '1,000' is far more often a thousand than one-point-zero.
    expect(parseUserNumber('1,000')).toBe(1000)
    expect(parseUserNumber('1.000')).toBe(1)
  })

  it('ignores spaces used as group separators', () => {
    expect(parseUserNumber('1 234 567')).toBe(1234567) // fr-FR narrow no-break space
    expect(parseUserNumber('1 234')).toBe(1234) // plain space
  })

  it('rejects non-numbers', () => {
    expect(parseUserNumber('')).toBeNull()
    expect(parseUserNumber('abc')).toBeNull()
    expect(parseUserNumber('k')).toBeNull()
    expect(parseUserNumber('.')).toBeNull()
  })
})
