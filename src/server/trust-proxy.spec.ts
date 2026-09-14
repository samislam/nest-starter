import { resolveTrustProxy } from './environment-schema'

/**
 * `trust proxy` decides where `req.ip` comes from, and `req.ip` is what the rate limiter buckets on.
 * A parsing slip here is a security bug, not a cosmetic one — hence the coverage.
 */
describe('resolveTrustProxy', () => {
  it('defaults to one hop when unset or blank', () => {
    expect(resolveTrustProxy('')).toBe(1)
    expect(resolveTrustProxy('   ')).toBe(1)
  })

  it('reads a hop count as a number, not a string', () => {
    // Express treats the string "2" and the number 2 differently — "2" is read as a hostname/IP to
    // trust, which would silently trust nothing.
    expect(resolveTrustProxy('2')).toBe(2)
    expect(resolveTrustProxy(' 3 ')).toBe(3)
  })

  it('supports disabling trust entirely', () => {
    expect(resolveTrustProxy('false')).toBe(false)
    expect(resolveTrustProxy('FALSE')).toBe(false)
  })

  it('supports trusting every hop', () => {
    expect(resolveTrustProxy('true')).toBe(true)
  })

  it('treats 0 as "trust nothing", not as falsy-so-default', () => {
    expect(resolveTrustProxy('0')).toBe(0)
  })

  it("passes Express's own forms through verbatim", () => {
    expect(resolveTrustProxy('loopback')).toBe('loopback')
    expect(resolveTrustProxy('uniquelocal')).toBe('uniquelocal')
    expect(resolveTrustProxy('10.0.0.0/8, 192.168.0.1')).toBe('10.0.0.0/8, 192.168.0.1')
  })

  it('does not accept a negative hop count as a number', () => {
    // Would be nonsense as a hop count; leave it as a string so Express rejects it loudly rather
    // than silently trusting a strange number of hops.
    expect(resolveTrustProxy('-1')).toBe('-1')
  })
})
