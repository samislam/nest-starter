import fs from 'node:fs'
import path from 'node:path'
import { Barrelsby } from '@clscripts/barrelsby'
import { runCommandsSequentially } from '@clscripts/cl-common'

const GENERATED_DIR = path.resolve(process.cwd(), 'src/generated/nestia')
const STRUCTURES_DIR = path.join(GENERATED_DIR, 'structures')
const MODULE_PATH = path.join(GENERATED_DIR, 'module.ts')
const STRUCTURES_EXPORT_LINE = 'export type * from "./structures";'

runCommandsSequentially([
  new Barrelsby({
    directory: STRUCTURES_DIR,
    delete: true,
  }).command,
])

const moduleSource = fs.readFileSync(MODULE_PATH, 'utf8')

if (moduleSource.includes(STRUCTURES_EXPORT_LINE)) {
  process.exit(0)
}

const marker = 'export * as functional from "./functional";'

if (!moduleSource.includes(marker)) {
  throw new Error(`Unexpected Nestia module format at ${MODULE_PATH}`)
}

const nextSource = moduleSource.replace(marker, `${STRUCTURES_EXPORT_LINE}\n${marker}`)

fs.writeFileSync(MODULE_PATH, nextSource)
