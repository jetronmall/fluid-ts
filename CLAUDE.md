# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A pnpm + Turborepo monorepo of JavaScript/TypeScript client libraries for **Jetron Fluid** (the Jetron Ticket headless API), published to npm under the `@jetronticket` scope. Always refer to the headless API as **Jetron Fluid** and write **Jetron Ticket** as two words.

## Commands

Run from the repo root:

- `pnpm build` — build every package (Turborepo, cached)
- `pnpm dev` — build in watch mode
- `pnpm lint` — lint every package
- `pnpm typecheck` — type-check every package (`tsc --noEmit`)
- `pnpm format` / `pnpm format:check` — Prettier over the repo
- `pnpm check` — lint + typecheck + build (run this before considering work done)

Target one package with `--filter`, e.g. `pnpm --filter @jetronticket/api build`.

- `pnpm changeset` — record a version bump + changelog entry for a change (run this in any PR that changes a published package).

There is **no test runner configured yet**. When adding tests, wire a `test` task into `turbo.json` and each package's `package.json` rather than running the runner ad hoc.

## Architecture

### Workspace layout

- `packages/*` — **published** libraries (currently `@jetronticket/api`).
- `tooling/*` — **private, unpublished** shared config consumed via `workspace:*`:
  - `@jetronticket/typescript-config` — `base.json` (strict) and `library.json` (adds `outDir`/`rootDir`); packages extend `@jetronticket/typescript-config/library.json`.
  - `@jetronticket/eslint-config` — a single flat config (`index.mjs`) that every package re-exports from its own `eslint.config.mjs`.

To add a package: create `packages/<name>/`, extend the two shared configs, add `tsup` + `typescript` + `eslint` + the two workspace configs as devDependencies, and mirror the `@jetronticket/api` scripts (`build`/`dev`/`lint`/`typecheck`/`clean`).

### Build & publishing

Each package builds with **tsup** to dual ESM + CJS plus declaration files (`.d.ts` and `.d.cts`), wired through the `exports` map (`import`/`require` conditions). Packages set `"type": "module"`, `sideEffects: false`, and `publishConfig.access: public`.

Releases are **CLI-only** (no CI/CD workflow) and use **Changesets** for versioning. Flow: record intent with `pnpm changeset`, apply it with `pnpm run version-packages` (bumps versions, writes `CHANGELOG.md`), then publish. Private `tooling/*` packages are skipped automatically. The `/release:api` slash command (`.claude/commands/release/api.md`), or the `pnpm release:api` script, wraps this end to end for `@jetronticket/api`.

npm enforces a 2FA-level check at publish time. npm now only issues **granular access tokens**, and the one in `~/.npmrc` must have **read-and-write** package permission for the `@jetronticket` scope — that write-capable granular token _is_ the "bypass 2fa" token npm asks for. A read-only or wrongly scoped token returns `E403: Two-factor authentication or granular access token with bypass 2fa enabled is required`. Gotcha for the first publish: a token scoped to a specific package can't create a package that does not exist yet, so scope it to **all packages** or the **`@jetronticket` scope** for the initial release. With a valid token, `pnpm release:api` publishes with no OTP (account 2FA is disabled; if later enabled, add `--otp=<code>`). Do **not** use `changeset publish` — `@changesets/cli` 2.31.1 crashes with `Cannot read properties of undefined (reading 'includes')` while parsing that `E403`, masking the real cause; publish directly with pnpm as the `release:api` script does.

### TypeScript version constraint (important)

The workspace is pinned to TypeScript 5.x via `overrides` in `pnpm-workspace.yaml`, and `@jetronticket/eslint-config` carries an explicit `typescript` 5.x devDependency. This is deliberate: TypeScript 7 (the native compiler) is not yet supported by `typescript-eslint` or tsup's declaration generator (`rollup-plugin-dts`). Removing the pin breaks `lint` and the DTS build. Revisit only when that tooling supports TS 7.

`esbuild`'s install script is allow-listed under `allowBuilds` in `pnpm-workspace.yaml` — needed for tsup to run.

## `@jetronticket/api`

A hand-written, dependency-free client over the platform `fetch` (browsers and Node 18+). It is **spec-driven**: `packages/api/specs/openapi.yaml` is the source of truth, and the code mirrors it. When the spec changes, update the types and client together.

- `src/types.ts` — every schema/request/response type and the enums (as string-literal unions). Money is integer minor units; date-times are ISO strings.
- `src/client.ts` — `createClient({ apiKey })` returning one method per endpoint. `baseUrl` is optional and defaults to `DEFAULT_BASE_URL` (production); it exists only for future alternate environments and should not be promoted in docs — event promoters talk to the production API. All requests go through a single internal `request()` helper that sets headers, serializes the body, and unwraps the response.
- `src/errors.ts` — `ApiError` (parses the `{ message, status, error_code }` envelope; carries the raw `Response`).
- `src/index.ts` — public surface (`createClient`, `ApiError`, all types).

Conventions to preserve when extending the client:

- Success responses are wrapped `{ status: true, data }`; every method returns an `ApiResult<T>` (`{ data, status, etag, notModified, response }`) where `data` is the unwrapped payload — `null` only on a `304`.
- Non-2xx throws `ApiError`; `304` is not an error (`notModified: true`, `data: null`).
- Headers are handled centrally in `request()`: `Authorization: Bearer` (skipped for `/health`), `X-Device-ID` for reservation/order calls (required for `createOrder`), `If-None-Match`/`ETag` for the two conditional GETs (`listEvents`, `getEvent`), `Content-Type` only when a body is present.
- Use the ambient-`Headers`-derived `HeadersInit` type rather than the DOM lib — this library must not depend on `lib: ["DOM"]`.
