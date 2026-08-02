// Publishes any public package under packages/* whose current version is not yet
// on npm, using `npm publish` directly.
//
// Why not `changeset publish`? In a pnpm workspace it shells out to `pnpm publish`,
// which does NOT perform npm's OIDC token exchange, so Trusted Publishing fails with
// an anonymous-write E404. `npm publish` (npm >= 11.5.1) does the OIDC exchange.
//
// Idempotent: skips versions already on npm, so re-runs on main are safe.
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'

const PACKAGES_DIR = 'packages'

for (const entry of readdirSync(PACKAGES_DIR, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue

  const pkgDir = `${PACKAGES_DIR}/${entry.name}`
  let pkg
  try {
    pkg = JSON.parse(readFileSync(`${pkgDir}/package.json`, 'utf8'))
  } catch {
    continue // no package.json — skip
  }
  if (pkg.private || !pkg.name || !pkg.version) continue

  const { name, version } = pkg

  let publishedVersion = ''
  try {
    publishedVersion = execFileSync('npm', ['view', `${name}@${version}`, 'version'], {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim()
  } catch {
    // `npm view` errors when the version does not exist yet — that's the publish case.
  }

  if (publishedVersion === version) {
    console.log(`${name}@${version} already published — skipping.`)
    continue
  }

  console.log(`Publishing ${name}@${version} …`)
  execFileSync('npm', ['publish', '--access', 'public'], { cwd: pkgDir, stdio: 'inherit' })
}
