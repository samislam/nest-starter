import { localized, cleanLocalized } from './localized'

describe('localized', () => {
  it('returns the translation for the language when present', () => {
    expect(localized('Albaraka bank', { ar: 'بنك البركة' }, 'ar')).toBe('بنك البركة')
  })
  it('falls back to the base when the language is missing, empty, or blank', () => {
    expect(localized('Albaraka bank', { ar: 'بنك البركة' }, 'tr')).toBe('Albaraka bank')
    expect(localized('Albaraka bank', { ar: '   ' }, 'ar')).toBe('Albaraka bank')
    expect(localized('Albaraka bank', {}, 'ar')).toBe('Albaraka bank')
    expect(localized('Albaraka bank', null, 'ar')).toBe('Albaraka bank')
    expect(localized('Albaraka bank', { ar: 'x' }, null)).toBe('Albaraka bank')
  })
  it('ignores a malformed (array / non-string) map', () => {
    expect(localized('base', ['x'] as unknown as null, 'ar')).toBe('base')
    expect(localized('base', { ar: 5 } as unknown as null, 'ar')).toBe('base')
  })
})

describe('cleanLocalized', () => {
  it('trims values, drops blanks, and never keeps the base language key', () => {
    expect(cleanLocalized({ ar: '  بنك  ', tr: '', fr: '   ' }, 'en')).toEqual({ ar: 'بنك' })
    expect(cleanLocalized({ en: 'Base', ar: 'عربي' }, 'en')).toEqual({ ar: 'عربي' })
    expect(cleanLocalized(null)).toEqual({})
  })
})
