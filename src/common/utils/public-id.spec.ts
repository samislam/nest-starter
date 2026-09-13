import { generatePublicId, normalisePublicId, publicRef } from './public-id'

/**
 * These codes are read down a phone, typed off screenshots, and quoted to support. The properties
 * that matter are therefore about legibility and unguessability, not just uniqueness.
 */
describe('public reference codes', () => {
  it('never emits a character that is misread', () => {
    // 0/O and 1/I/L are the pairs people transcribe wrongly.
    const sample = Array.from({ length: 400 }, generatePublicId).join('')
    expect(sample).not.toMatch(/[01OIL]/)
  })

  it('is not sequential', () => {
    const codes = Array.from({ length: 50 }, generatePublicId)
    expect(new Set(codes).size).toBe(codes.length)
    // A counter would make each code an increment of the last; random ones share no prefix.
    const prefixes = new Set(codes.map((code) => code.slice(0, 4)))
    expect(prefixes.size).toBeGreaterThan(40)
  })

  it('normalises how a user actually types a code back', () => {
    expect(normalisePublicId('#a3f9-ck24')).toBe('A3F9CK24')
    expect(normalisePublicId(' A3F9CK24 ')).toBe('A3F9CK24')
  })

  /**
   * A character outside the alphabet is dropped rather than guessed at. Someone typing O for what
   * they read as 0 has made an error there is no correct repair for, and the resulting code simply
   * fails to match — which is safer than mapping it onto a real record belonging to someone else.
   */
  it('drops characters the alphabet excludes instead of guessing', () => {
    expect(normalisePublicId('A3F9OIL0')).toBe('A3F9')
  })

  /** Records created before public codes existed must still display something stable. */
  it('falls back to the id tail when no code is stored', () => {
    expect(publicRef({ id: 'cmrtqhdl4050uljh8czmmatjv', publicId: 'A3F9CK24' })).toBe('#A3F9CK24')
    expect(publicRef({ id: 'cmrtqhdl4050uljh8czmmatjv', publicId: null })).toBe('#MMATJV')
  })
})

/**
 * Support's actual workflow: a user pastes the code as they saw it, decoration and all. Normalising
 * before the query is what makes that work, so the shapes people really send are pinned here.
 */
describe('finding a record from a quoted code', () => {
  it('reduces every shape a user sends to the same lookup value', () => {
    const stored = '43DK67VM'
    for (const typed of ['#43DK67VM', '43dk67vm', '#43DK-67VM', ' 43DK 67VM ', '#43dk67vm.']) {
      expect(normalisePublicId(typed)).toBe(stored)
    }
  })

  it('still matches on a partial code, which is what people half-remember', () => {
    expect('43DK67VM'.includes(normalisePublicId('#43dk'))).toBe(true)
  })
})
