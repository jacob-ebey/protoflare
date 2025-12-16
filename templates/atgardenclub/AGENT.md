# AGENT.md

## Project summary

**AT Garden Club** is a decentralized CSS showcase inspired by CSS Zen Garden / Style Stage, built on the **AT Protocol**. Users authenticate via ATProto OAuth, submit a stylesheet which is stored in **their own PDS** (as an ATProto record), and this app indexes those records into a **Cloudflare D1** database for browsing.

Tech stack highlights:
- **Cloudflare Workers** runtime (`wrangler.jsonc`)
- **Protoflare** request handling + ATProto OAuth helpers (`protoflare/server`)
- **React Router (RSC / experimental)** routes + loaders/actions
- **Durable Object** Jetstream consumer to ingest the network firehose
- **Generated ATProto lexicon client** in `src/lexicons/`

## How to run (local/dev)

Core workflows from `package.json`:
- **Install**: `pnpm i`
- **Dev server**: `pnpm dev`
- **Build**: `pnpm build`
- **Preview build**: `pnpm preview`
- **Typecheck**: `pnpm typecheck`
- **Deploy**: `pnpm deploy`

Database:
- **Apply D1 migrations**: `pnpm db:migrate`
  - Schema lives in `migrations/` (currently `stylestage` table + FTS triggers).

Codegen:
- **Lexicon codegen** (after editing `/lexicons/*.json`): `pnpm lexgen`
- **Wrangler typegen** (after editing `wrangler.jsonc`): `pnpm typegen`

## Runtime configuration (bindings/env)

`wrangler.jsonc` defines the Worker bindings:
- **`SESSION_SECRET`**: required at runtime (worker throws if missing).
- **`OAUTH_STORAGE`**: KV namespace used by Protoflare for OAuth state/storage.
- **`DB`**: D1 database used for indexing/querying style submissions.
- **`JETSTREAM_CONSUMER`**: Durable Object namespace for the Jetstream consumer.

Generated runtime types live in `worker-configuration.d.ts` (do not edit by hand; regenerate via `pnpm typegen`).

## Architecture map (where to change what)

### Request entrypoint
- `src/worker.ts`
  - Calls `handleRequest({ routes, sessionSecrets, authNamespace, ... })`.
  - Sets `hydrate` only for `"/contribute"` and `"/styles"` (client components/hooks must assume other routes may be purely server-rendered).

### Routes
- Route config + typed route params: `src/routes.tsx`
- Route modules: `src/routes/*`
  - Server route modules export a default component and/or `loader()`. loaders should not be used except for standalone "resource" routes. Dataloading is done via async Server Components
  - Client interactive helpers live in `*.client.tsx` and are used on hydrated pages.

Notable routes:
- **OAuth**:
  - `src/routes/oauth-client-metadata.ts`: serves client metadata from `getAtprotoClient()`.
  - `src/routes/oauth-callback.ts`: exchanges OAuth code, stores `{did, handle}` in session, then redirects.
- **CSS download endpoint**:
  - `src/routes/style-download.ts`: `loader()` returns `text/css` from DB.
- **Styles directory + pagination**:
  - `src/routes/styles.tsx`: uses `cacheTag("stylestage")` + cursor-based pagination.
  - `src/routes/styles.client.tsx`: client-side “Refresh” + “Next page” buttons.
- **Style “stage” page**:
  - `src/routes/stylestage.tsx`: renders the base HTML and swaps stylesheet to either the default Style Stage CSS or a user submission.

Note: `src/routes.tsx`’s `Register["pages"]` includes `"/feed"` and `"/subscribe"`, and the nav links to them exist in `src/components/layout.tsx`, but there are currently **no route modules wired for those paths** in the `routes` array. If implementing them, add entries to `routes` and create matching `src/routes/*.tsx` modules (or remove the unused paths/links).

### Server actions (mutations)
- `src/actions.ts` (`"use server"`)
  - `loginAction`: validates handle, calls `getAtprotoClient().authorize(handle)`, redirects to issuer.
  - `logoutAction`: logs out and destroys session.
  - `submitStyleAction`: validates + autoprefixes CSS, writes ATProto record (`club.atgarden.stylestage`), then attempts to insert into D1 and redirects to the new style page.

Validation helpers:
- Schemas in `src/forms.ts` (Arktype).
- Shared form action wrapper in `src/lib/actions.ts`.

### Data access (queries)
- `src/data.ts`
  - DID resolution utilities (`resolveDidFromHandle`, `resolveDidDocument`) and small view-model shaping (`displayName`).
  - D1 queries for list/get, cursor encoding/decoding, and cached query functions via `react` `cache`.

When adding/changing queries:
- Prefer adding new functions to `src/data.ts` and consuming them in routes.
- Keep DB schema changes in `migrations/` and update consumers accordingly.

### Jetstream ingestion (real-time indexing)
- `src/storage/jetstream.ts`
  - Durable Object `JetstreamConsumer` extends `JetstreamConsumerDurableObject`.
  - Listens for commits in `club.atgarden.stylestage`, autoprefixes CSS, and upserts into D1.

### Client-side patterns
- Client-only components must start with `"use client"`.
- Forms use the project’s `src/components/form.tsx` wrapper:
  - On the client, it intercepts submit, runs Arktype validation, then calls the action via `startTransition`.
  - On the server (not hydrated), it falls back to plain `action`.
- Hydration detection is via `src/components/hooks.ts` `useHydrated()`.

## Lexicons (AT Protocol schema)

- Source lexicons live under `/lexicons/`.
- Generated TS client + types live under `src/lexicons/` and begin with `/** GENERATED CODE - DO NOT MODIFY */`.
- After editing lexicons, run `pnpm lexgen` to regenerate `src/lexicons/*`.

## 3rd party libraries (vendor pattern)

Many UI/component libraries are **not marked** `"use client"` and will break if imported directly into Server Components. This repo’s pattern is:

- **Re-export from `vendor/`**: create `vendor/<lib>.ts` starting with `"use client"` and re-export only what you use.
- **Alias the package** in `vite.config.ts` so imports resolve to your vendored wrapper (and optionally add an `npm:` alias when needed).
- **Import the alias everywhere** (never import the upstream package directly).

Example already in this repo:
- `vendor/react-aria-components.ts` + `vite.config.ts` alias for `react-aria-components`

## Conventions for changes

- **Don’t edit generated files**: `src/lexicons/*`, `worker-configuration.d.ts`, `dist/*`.
- **Keep server vs client boundaries explicit**:
  - Mutations go in `"use server"` actions (`src/actions.ts`).
  - Interactivity goes in `"use client"` modules (`*.client.tsx`).
- **When adding a route**:
  - Add to `routes` in `src/routes.tsx`.
  - Create `src/routes/<name>.tsx` (and `<name>.client.tsx` if needed).
  - Update navigation in `src/components/layout.tsx` if it’s user-facing.


