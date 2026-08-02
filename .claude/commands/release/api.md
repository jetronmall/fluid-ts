---
description: Release and publish @jetronticket/api to npm
argument-hint: '[npm-otp-code]'
allowed-tools: Bash(pnpm:*), Bash(git:*), Bash(npm:*), Bash(ls:*), Read, Edit
---

Release and publish the `@jetronticket/api` package to npm.

Key context (do not skip):

- Publishing requires a token that satisfies npm's publish-time 2FA policy. npm now only issues **granular access tokens**; the one in `~/.npmrc` must have **read-and-write** package permission for the `@jetronticket` scope. A read-only or wrongly scoped token returns `E403: Two-factor authentication or granular access token with bypass 2fa enabled is required`. First-publish gotcha: a token scoped to a specific package can't create a package that doesn't exist yet — scope it to all packages or the `@jetronticket` scope.
- Account 2FA is currently disabled, so no OTP is needed. `$ARGUMENTS` may carry an OTP for the case where account 2FA is later enabled — it is usually empty.
- Do NOT use `changeset publish`; it crashes (`Cannot read properties of undefined (reading 'includes')`) while parsing npm's error and masks the real cause. Publish directly with pnpm.

Do the following in order, stopping and reporting if any step fails:

1. Show `git branch --show-current` and `git status --short`. If there are uncommitted changes unrelated to a release, warn the user before continuing.
2. Check for pending changesets: `ls .changeset/*.md` (ignore `README.md`). If any exist, run `pnpm run version-packages` to apply them (bumps the version and updates `CHANGELOG.md`). If none exist, keep the current version.
3. Read the target version from `packages/api/package.json`. Confirm it is not already published: run `npm view @jetronticket/api@<version> version`. If it returns that version, STOP — it is already on npm; nothing to publish.
4. Run `pnpm run check` (lint + typecheck + build). Do not publish if this fails.
5. Publish `@jetronticket/api`:
   - Base command: `pnpm --filter @jetronticket/api publish --no-git-checks --access public`
   - If `$ARGUMENTS` is non-empty, append `--otp=$ARGUMENTS`.
   - If it fails with `E403` mentioning two-factor / bypass, the `~/.npmrc` token lacks read-and-write for the `@jetronticket` scope. Tell the user to create a **granular access token** with read-and-write package permission scoped to all packages or `@jetronticket` (a package-specific scope can't create a new package), set it with `npm config set //registry.npmjs.org/:_authToken=<token>`, then retry. Do not keep retrying blindly.
6. Verify success: `npm view @jetronticket/api version` should report the new version. Report the published version and its npm URL.
7. If step 2 bumped the version, remind the user to commit the version bump + `CHANGELOG.md`.
