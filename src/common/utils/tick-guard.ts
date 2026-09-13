import { Logger } from '@nestjs/common'
import { TimeoutError, withTimeout } from './with-timeout'

/**
 * Runs a scheduled job's tick under a non-overlap guard that cannot wedge.
 *
 * The naive version of this is `if (this.running) return` with `running` cleared in a `finally`.
 * That guard is only as reliable as the tick clearing it: one await that never settles and the job
 * is dead forever — every later tick returns instantly, silently, and the only symptom is a job that
 * quietly stopped doing its work. That is how deposit scanning went blind for three hours.
 *
 * So: every tick is bounded by a timeout (the guard is always released), an overrun is logged as an
 * error rather than swallowed, and a tick that is merely slow says so. A stalled job must be noisy.
 */
export class TickGuard {
  private startedAt: number | null = null

  constructor(
    private readonly logger: Logger,
    /** Names the job in logs, e.g. 'Deposit scan'. */
    private readonly label: string,
    /** How long one tick may take before it is abandoned and the next allowed to start. */
    private readonly timeoutMs: number
  ) {}

  private elapsed(): number {
    return this.startedAt === null ? 0 : Math.round((Date.now() - this.startedAt) / 1000)
  }

  /** Runs `work`, unless the previous tick is still in flight. Never throws. */
  async run(work: () => Promise<void>): Promise<void> {
    if (this.startedAt !== null) {
      this.logger.warn(
        `${this.label}: still running after ${this.elapsed()}s — skipping this tick.`
      )
      return
    }

    this.startedAt = Date.now()
    try {
      await withTimeout(work(), this.timeoutMs, this.label)
    } catch (error) {
      if (error instanceof TimeoutError) {
        this.logger.error(
          `${this.label}: exceeded ${this.timeoutMs}ms and was abandoned — something is stalled. ` +
            `The next tick will retry; work already done is kept.`
        )
      } else {
        const message = error instanceof Error ? error.message : String(error)
        this.logger.error(`${this.label}: tick failed — ${message}`)
      }
    } finally {
      this.startedAt = null
    }
  }
}
