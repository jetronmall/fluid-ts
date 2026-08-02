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

Releases run **only in GitHub Actions** — there is no local publish path (npm requires account 2FA to publish, and a bypass token can't be minted without it, so local publishing is intentionally not used). Publishing uses **npm Trusted Publishing (OIDC)**: no `NPM_TOKEN`, no 2FA — the `id-token: write` permission plus a trusted publisher configured on npmjs.com is the auth, and provenance is automatic.

Flow (Changesets): in a PR that changes a published package, run `pnpm changeset` and commit the generated file. On merge to `main`, `.github/workflows/release.yml` runs `changesets/action`, which opens/updates a "Version Packages" PR (`pnpm run version-packages` → bumps versions, writes `CHANGELOG.md`); merging that PR triggers `pnpm run release` (`turbo run build && changeset publish`) to publish. Private `tooling/*` packages are skipped automatically.

One-time npm setup: on npmjs.com, add a **Trusted Publisher** for `@jetronticket/api` pointing at the `jetronmall/fluid-ts` repo and `release.yml`. The workflow upgrades npm (`npm install -g npm@latest`) because Trusted Publishing needs npm >= 11.5.1, which Node 22 doesn't ship by default.

Bootstrapping the first publish (chicken-and-egg): a Trusted Publisher can only be attached to a package that already exists, but the package can't exist until it's published, and npm requires 2FA for that first publish. So the initial `@jetronticket/api` publish must use a real credential once — either a single manual publish (after `npm login` + enabling 2FA) run as `cd packages/api && npm publish --access public` or `npm publish ./packages/api --access public` (the `./` matters — `npm publish packages/api` is parsed as a GitHub `owner/repo` shorthand and fails with a git error), or by temporarily setting the `NPM_TOKEN` secret and uncommenting `NODE_AUTH_TOKEN` in `release.yml`. After the package exists, configure the Trusted Publisher and drop the token; every release after that is token-free OIDC.

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
