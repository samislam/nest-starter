import path from 'node:path'
import { concat } from 'concat-str'
import { createAppConfig } from '@/utils/create-app-config'

/**
 * Every operational tunable in one place.
 *
 * The rule: if a number decides *how the app behaves* — a poll cadence, a batch size, a timeout, a
 * page size, an upload ceiling — it belongs here, not at the top of a service file. Values fixed by
 * a protocol (AES-GCM's 12-byte IV, a 32-byte key) stay where they are: those are not tunable, and
 * putting them here would invite someone to "tune" them into a security bug.
 *
 * Secrets and per-environment values live in `.env` (see `environment-schema.ts`), not here.
 */
export default createAppConfig({
  appName: '@Nest-starter API backend',
  appDescription: concat('@Nest-starter API backend'),
  apiPrefix: 'api',
  uploadDir: path.resolve(process.cwd(), 'storage', 'uploads'),

  // Express defaults to 100kb, which bulk saves and JSON/YAML imports outgrow.
  bodyLimit: '10mb',

  // `perPage` reaches Prisma as `take`, so an unbounded value is a memory blow-up in one request.
  // Set the ceiling above real client usage so clamping never silently truncates a list someone
  // depends on.
  pagination: { defaultPerPage: 20, maxPerPage: 500 },
})
