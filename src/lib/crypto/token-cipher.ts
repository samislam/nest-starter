import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const KEY_LENGTH = 32

/**
 * Derives a 32-byte key from the configured secret. Accepts a 64-char hex string, a base64 string,
 * or any sufficiently long passphrase (utf8, truncated/validated to 32 bytes).
 */
function resolveKey(secret: string): Buffer {
  const hexCandidate = secret.length === 64 && /^[0-9a-fA-F]+$/.test(secret)
  if (hexCandidate) return Buffer.from(secret, 'hex')

  const base64Candidate = Buffer.from(secret, 'base64')
  if (base64Candidate.length === KEY_LENGTH) return base64Candidate

  const utf8 = Buffer.from(secret, 'utf8')
  if (utf8.length >= KEY_LENGTH) return utf8.subarray(0, KEY_LENGTH)

  throw new Error('Encryption secret must resolve to at least 32 bytes')
}

/**
 * Encrypts a secret value (a third-party API token, a webhook secret) with AES-256-GCM. The output bundles the iv,
 * auth tag and ciphertext as a single `iv:tag:ciphertext` base64 string safe to store at rest.
 */
export function encryptSecret(plaintext: string, secret: string): string {
  const key = resolveKey(secret)
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return [iv.toString('base64'), authTag.toString('base64'), ciphertext.toString('base64')].join(
    ':'
  )
}

/**
 * Reverses {@link encryptSecret}. Throws if the payload is malformed or the auth tag does not verify.
 */
export function decryptSecret(payload: string, secret: string): string {
  const key = resolveKey(secret)
  const [ivPart, tagPart, dataPart] = payload.split(':')
  if (!ivPart || !tagPart || !dataPart) {
    throw new Error('Malformed encrypted secret payload')
  }

  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivPart, 'base64'))
  decipher.setAuthTag(Buffer.from(tagPart, 'base64'))

  return Buffer.concat([
    decipher.update(Buffer.from(dataPart, 'base64')),
    decipher.final(),
  ]).toString('utf8')
}
