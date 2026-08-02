# Jetron Fluid libraries

Monorepo of JavaScript/TypeScript client libraries for **Jetron Fluid** (the Jetron Ticket headless API), published to the npm registry.

## Stack

- [pnpm](https://pnpm.io) workspaces
- [Turborepo](https://turbo.build) task runner
- [tsup](https://tsup.egoist.dev) for building (dual ESM + CJS + type declarations)
- [ESLint](https://eslint.org) flat config + [Prettier](https://prettier.io)

## Layout

- `packages/*` — published libraries (e.g. `@jetronticket/api`)
- `tooling/*` — internal, unpublished shared config (`@jetronticket/eslint-config`, `@jetronticket/typescript-config`)

## Commands

Run from the repo root:

- `pnpm install` — install all workspace dependencies
- `pnpm build` — build every package
- `pnpm dev` — build in watch mode
- `pnpm lint` — lint every package
- `pnpm typecheck` — type-check every package
- `pnpm format` — format the repo with Prettier
- `pnpm check` — lint + typecheck + build

Target a single package with `--filter`, e.g. `pnpm --filter @jetronticket/api build`.
