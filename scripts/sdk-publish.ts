import chalk from 'chalk'
import { readFileSync } from 'fs'
import { confirm, select } from '@inquirer/prompts'
import { runCommand } from '@clscripts/cl-common'

type ReleaseType = 'patch' | 'minor' | 'major'

const VALID_RELEASE_TYPES: ReleaseType[] = ['patch', 'minor', 'major']
const SDK_PACKAGE_DIR = 'packages/sdk'
const SDK_PACKAGE_JSON_PATH = `${SDK_PACKAGE_DIR}/package.json`

function readSdkPackageJson() {
  return JSON.parse(readFileSync(SDK_PACKAGE_JSON_PATH, 'utf8')) as {
    name: string
    version: string
  }
}

function getNextSdkVersion(currentVersion: string, releaseType: ReleaseType) {
  const match = /^(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)$/.exec(currentVersion)

  if (match?.groups == null) {
    console.error(`Unsupported SDK version format "${currentVersion}". Expected x.y.z.`)
    process.exit(1)
  }

  let major = Number(match.groups.major)
  let minor = Number(match.groups.minor)
  let patch = Number(match.groups.patch)

  if (releaseType === 'major') {
    major += 1
    minor = 0
    patch = 0
  } else if (releaseType === 'minor') {
    minor += 1
    patch = 0
  } else {
    patch += 1
  }

  return `${major}.${minor}.${patch}`
}

function parseReleaseTypeFromArgv(): ReleaseType | null {
  const rawArg = process.argv[2]
  if (rawArg == null) return null
  if (VALID_RELEASE_TYPES.includes(rawArg as ReleaseType)) return rawArg as ReleaseType

  console.error(
    `Invalid release type "${rawArg}". Expected one of: ${VALID_RELEASE_TYPES.join(', ')}.`
  )
  process.exit(1)
}

async function promptForReleaseType(): Promise<ReleaseType> {
  return select<ReleaseType>({
    message: 'Select SDK version bump type',
    choices: [
      { value: 'patch', name: 'patch' },
      { value: 'minor', name: 'minor' },
      { value: 'major', name: 'major' },
    ],
  })
}

async function main() {
  const releaseType = parseReleaseTypeFromArgv() ?? (await promptForReleaseType())
  const sdkPackageJson = readSdkPackageJson()
  const currentVersion = sdkPackageJson.version
  const nextVersion = getNextSdkVersion(currentVersion, releaseType)
  const releaseLabel = `${sdkPackageJson.name}/${nextVersion}`

  console.log(chalk.hex('#ec4899').underline(releaseLabel))

  const shouldPublish = await confirm({
    message: `Please make sure all intended changes are committed before publishing. This will publish ${chalk.hex('#ec4899').underline(`version ${nextVersion}`)} for ${sdkPackageJson.name}. Do you want to continue?`,
    default: false,
  })

  if (!shouldPublish) {
    console.log('Publish cancelled.')
    process.exit(0)
  }

  runCommand(`pnpm version ${releaseType} --dir ${SDK_PACKAGE_DIR}`)
  runCommand('pnpm run sdk:build')
  runCommand(`pnpm publish --dir ${SDK_PACKAGE_DIR}`)
}

void main()
