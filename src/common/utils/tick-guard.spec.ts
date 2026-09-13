import { Logger } from '@nestjs/common'
import { TickGuard } from './tick-guard'

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

describe('TickGuard', () => {
  let logged: string[]
  let logger: Logger

  beforeEach(() => {
    logged = []
    logger = {
      warn: (message: string) => logged.push(`WARN ${message}`),
      error: (message: string) => logged.push(`ERROR ${message}`),
    } as unknown as Logger
  })

  // The regression this class exists for: a tick that never settles used to leave the job's
  // `running` flag set for good, so every later tick returned instantly and the job went silently
  // dead. Deposit scanning stopped for three hours that way, logging nothing.
  it('abandons a hung tick and keeps running', async () => {
    const guard = new TickGuard(logger, 'Test job', 100)
    void guard.run(() => new Promise<void>(() => {})) // never settles, like a stalled RPC call
    await sleep(200)

    let ran = false
    await guard.run(async () => {
      ran = true
    })

    expect(ran).toBe(true)
    expect(logged.some((line) => line.startsWith('ERROR') && line.includes('abandoned'))).toBe(true)
  })

  it('does not overlap a tick that is still in flight, and says so', async () => {
    const guard = new TickGuard(logger, 'Slow job', 5_000)
    const inFlight = guard.run(() => sleep(200))

    let overlapped = false
    await guard.run(async () => {
      overlapped = true
    })
    await inFlight

    expect(overlapped).toBe(false)
    expect(logged.some((line) => line.includes('skipping this tick'))).toBe(true)
  })

  it('releases the guard once a tick completes', async () => {
    const guard = new TickGuard(logger, 'Test job', 5_000)
    await guard.run(() => sleep(10))

    let ran = false
    await guard.run(async () => {
      ran = true
    })
    expect(ran).toBe(true)
  })

  it('reports a failing tick without wedging the job', async () => {
    const guard = new TickGuard(logger, 'Test job', 5_000)
    await guard.run(() => Promise.reject(new Error('boom')))

    let ran = false
    await guard.run(async () => {
      ran = true
    })

    expect(ran).toBe(true)
    expect(logged.some((line) => line.startsWith('ERROR') && line.includes('boom'))).toBe(true)
  })

  it('never rejects, so a scheduler tick cannot crash the process', async () => {
    const guard = new TickGuard(logger, 'Test job', 50)
    await expect(guard.run(() => Promise.reject(new Error('boom')))).resolves.toBeUndefined()
    await expect(guard.run(() => new Promise<void>(() => {}))).resolves.toBeUndefined()
  })
})
