import { EchoCli } from '@clscripts/echo-cli'
import { Prettier } from '@clscripts/prettier'
import { runCommandsSequentially } from '@clscripts/cl-common'

runCommandsSequentially([
  new EchoCli({ message: `Formatting code...` }).command,
  new Prettier({
    noErrorOnUnmatchedPattern: true,
    // Quote the globs so the shell (`spawnSync` with shell:true uses /bin/sh, which has no
    // `globstar`) passes them through literally and prettier expands `**` recursively itself.
    // Unquoted, /bin/sh collapses `**` to a single `*` and only top-level dirs get formatted.
    files: ["'./src/**/*.{ts,js}'", "'./test/**/*.{ts,js}'"],
  }).command,
])
