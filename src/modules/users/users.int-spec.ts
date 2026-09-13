import { PrismaClient } from '@/generated/prisma'
import { createTestPrisma, seedBasics, truncateAll } from '@/test-utils/test-db'

/**
 * Example integration spec — the template's proof that the harness works, and the shape to copy.
 *
 * What belongs here rather than in a `*.spec.ts` unit test: anything whose correctness depends on the
 * database engine itself — unique-constraint races, conditional `updateMany` row locks, transaction
 * isolation, cascade behaviour. A mocked Prisma client will happily let two concurrent writes both
 * "succeed"; real Postgres will not, which is the whole point.
 *
 * Run with `pnpm run test:int` (see jest.integration.config.ts for provisioning).
 */
describe('users (integration)', () => {
  let prisma: PrismaClient

  beforeAll(() => {
    prisma = createTestPrisma()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    await truncateAll(prisma)
  })

  it('seeds the basic object graph', async () => {
    const { userId } = await seedBasics(prisma)
    const user = await prisma.user.findUnique({ where: { id: userId } })
    expect(user?.username).toBe('test-user')
  })

  it('truncates between tests', async () => {
    expect(await prisma.user.count()).toBe(0)
  })

  it('lets exactly one of two concurrent writes win the unique username', async () => {
    // Both inserts race for the same unique key. Postgres must reject one — this is the class of bug
    // a mocked client cannot catch.
    const results = await Promise.allSettled([
      prisma.user.create({ data: { name: 'A', username: 'race', passwordHash: 'x' } }),
      prisma.user.create({ data: { name: 'B', username: 'race', passwordHash: 'x' } }),
    ])

    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1)
    expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1)
    expect(await prisma.user.count({ where: { username: 'race' } })).toBe(1)
  })
})
