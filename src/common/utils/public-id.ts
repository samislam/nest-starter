import { randomInt } from 'node:crypto'

/**
 * Alphabet for public reference codes.
 *
 * Uppercase and digits only, minus every pair that is misread when a code is spoken over the phone
 * or typed off a screenshot: `0`/`O`, `1`/`I`/`L`. These codes exist to be quoted by users to
 * support, so a character nobody can transcribe reliably costs more than the entropy it adds.
 */
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'

/** Length of a generated code. 31^8 ≈ 8.5×10^11 — collisions are a retry, not a design problem. */
const LENGTH = 8

/**
 * A short, public reference for an order or an ad.
 *
 * Random rather than sequential on purpose. A counter would publish the platform's volume to anyone
 * who places two orders, and would let someone walk the range to find records that are not theirs.
 *
 * `randomInt` rather than `Math.random`: these are guessed at, and a predictable PRNG makes the
 * whole point of not being sequential moot.
 */
export const generatePublicId = (): string => {
  let out = ''
  for (let i = 0; i < LENGTH; i += 1) out += ALPHABET[randomInt(ALPHABET.length)]
  return out
}

/**
 * Normalises a code a user typed or pasted, so `#a3f9-c1k2` and `A3F9C1K2` reach the same record.
 * Strips anything outside the alphabet rather than rejecting it — a leading `#` is how people write
 * these, and punctuation from a copy-paste should not be their problem.
 */
export const normalisePublicId = (value: string): string =>
  value
    .toUpperCase()
    .split('')
    .filter((char) => ALPHABET.includes(char))
    .join('')

/**
 * The reference shown to users for an order or ad.
 *
 * Falls back to a slice of the internal id for records created before public codes existed, so old
 * orders still display something stable rather than nothing.
 *
 * Every display site must go through this. When only some did, the same order appeared as two
 * different numbers depending on which screen you were on — which defeats the point of having a
 * reference users quote at all.
 */
export const publicNumber = (record: { publicId?: string | null; id: string }): string =>
  record.publicId ?? record.id.slice(-6).toUpperCase()

/** Same reference WITH the leading `#`. Use this for display; use {@link publicNumber} when the template
 * writes the `#` itself (so a token stays a bare number). */
export const publicRef = (record: { publicId?: string | null; id: string }): string =>
  `#${publicNumber(record)}`
