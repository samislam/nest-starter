/** Thrown when work outlives its budget. Carries the label so logs name the thing that stalled. */
export class TimeoutError extends Error {
  constructor(label: string, ms: number) {
    super(`${label} timed out after ${ms}ms`)
    this.name = 'TimeoutError'
  }
}

/**
 * Rejects with {@link TimeoutError} if `work` hasn't settled within `ms`.
 *
 * A promise can't be cancelled, so `work` may still be running after this rejects — this bounds how
 * long the *caller* waits, which is what keeps a stalled dependency from holding a lock, a scheduler
 * guard, or a request open forever. Late rejections from the abandoned work are swallowed: nobody is
 * listening any more, and an unhandled rejection would take the process down.
 */
export const withTimeout = <T>(work: Promise<T>, ms: number, label: string): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined
  const expiry = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError(label, ms)), ms)
  })

  work.catch(() => {})
  return Promise.race([work, expiry]).finally(() => clearTimeout(timer))
}
