/**
 * Distinguishing "OUR server lost internet" from "the blockchain RPC is down".
 *
 * A failed RPC read is ambiguous: the node could be unreachable, OR our own host could have lost all
 * outbound connectivity — in which case the chain is fine and a "Blockchain offline" alert is wrong and
 * alarming. {@link hasInternetAccess} settles it: if we can still reach the general internet but not the
 * RPC, the fault is the RPC/node (a real chain outage); if we can't reach anything, the fault is ours.
 */

/**
 * Neutral liveness endpoints. Each answers a tiny/empty response and exists precisely for connectivity
 * checks, so we hit them ONLY to prove packets flow — we never read or store their bodies, and send no
 * data of our own. Two independent providers so one provider's blip isn't read as "we're offline".
 */
const PROBE_URLS = [
  'https://www.gstatic.com/generate_204', // Google — 204 No Content
  'https://1.1.1.1/cdn-cgi/trace', // Cloudflare — tiny text
] as const

/** Per-probe ceiling. Short: this only runs right after an RPC read has ALREADY failed, so we want a
 * quick verdict, not another long hang. */
const PROBE_TIMEOUT_MS = 4000

/** True if a single probe URL responds at all (any HTTP status counts — the point is that the request
 * completed a round-trip, not that the endpoint is "healthy"). Only a network error / timeout is false. */
const probe = async (url: string): Promise<boolean> => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS)
  try {
    await fetch(url, { method: 'GET', signal: controller.signal, cache: 'no-store' })
    return true
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Whether THIS server currently has outbound internet at all. Returns true as soon as ANY probe
 * responds. Call it only after an on-chain read has already failed — never on the happy path — to tell a
 * genuine chain/RPC outage (internet up, RPC down) from our own connectivity loss (internet down).
 */
export const hasInternetAccess = async (): Promise<boolean> => {
  const results = await Promise.all(PROBE_URLS.map(probe))
  return results.some(Boolean)
}
