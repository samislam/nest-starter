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

  it('normalises Eastern (Arabic/Persian) digits', () => {
    expect(parseUserNumber('٢٠٠٠')).toBe(2000)
    expect(parseUserNumber('۱۵')).toBe(15)
    expect(parseUserNumber('١٬٠٠٠')).toBe(1000) // Arabic thousands separator
  })

  it('rejects non-numbers', () => {
    expect(parseUserNumber('')).toBeNull()
    expect(parseUserNumber('abc')).toBeNull()
    expect(parseUserNumber('k')).toBeNull()
    expect(parseUserNumber('.')).toBeNull()
  })
})
