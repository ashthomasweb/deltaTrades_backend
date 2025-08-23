import { execSync } from 'node:child_process'
import { writeFileSync, readFileSync } from 'node:fs'

function gitSha() {
  console.log('gitSHA')
  try { return process.env.GIT_SHA || execSync('git rev-parse HEAD').toString().trim() }
  catch { return 'dev' }
}

const full = gitSha()
const short = full.slice(0, 7)
const builtAt = new Date().toISOString()
const out = `// NOTE: SHA is created on new commits. Local value will match the last commit.\nexport const BUILD_INFO = { gitSha: '${full}', shortSha: '${short}', builtAt: '${builtAt}' } as const\n`

const path = 'src/__core/build-info.ts'
try {
  if (readFileSync(path, 'utf8') === out) process.exit(0) // no churn
} catch {}
writeFileSync(path, out)
