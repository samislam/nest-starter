import { PrismaClient } from '@/generated/prisma'

/**
 * Integration-test database helpers. These talk to a REAL Postgres (`app_test`), never the dev DB, so
 * concurrency guards (conditional `updateMany` row locks, unique-constraint races, transaction
 * isolation) can be proven against the same engine that runs in production — a mock or SQLite cannot
 * reproduce those semantics.
 *
 * Provision once: `createdb app_test`, then push the current schema to it:
 *   `TEST_DATABASE_URL=… npx prisma db push --schema src/database/schema.prisma --skip-generate`
 *
 * Each spec truncates between tests via {@link truncateAll} so cases don't leak into each other.
 * Specs are named `*.int-spec.ts` and run with `pnpm run test:int` (see jest.integration.config.ts);
 * the default `pnpm test` run stays fast and DB-free.
 */
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/app_test?schema=public'

/** A PrismaClient bound to the test DB. Pass it wherever a service expects a `DatabaseService` — the
 * service only uses PrismaClient methods, so the real client stands in directly. */
export const createTestPrisma = (): PrismaClient =>
  new PrismaClient({ datasources: { db: { url: TEST_DATABASE_URL } } })

/** Wipes every data table (RESTART IDENTITY + CASCADE) so each test starts from empty. Runs in one
 * statement; excludes any Prisma bookkeeping table. */
export async function truncateAll(prisma: PrismaClient): Promise<void> {
  const rows = await prisma.$queryRawUnsafe<Array<{ tablename: string }>>(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT LIKE '\\_prisma%'`
  )
  if (rows.length === 0) return
  const list = rows.map((r) => `"public"."${r.tablename}"`).join(', ')
  await prisma.$executeRawUnsafe(`TRUNCATE ${list} RESTART IDENTITY CASCADE`)
}

export interface SeedBasics {
  userId: string
}

/**
 * The minimal object graph most specs need. Grow this as the schema grows: it should create the few
 * rows that everything else foreign-keys to, and return their ids — so a spec that needs "a user and
 * their account" doesn't rebuild that graph by hand each time.
 */
export async function seedBasics(prisma: PrismaClient): Promise<SeedBasics> {
  const user = await prisma.user.create({
    data: { name: 'Test User', username: 'test-user', passwordHash: 'test' },
  })
  return { userId: user.id }
}
