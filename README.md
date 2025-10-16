# Protoflare

Protoflare helps you build AT Protocol apps on Cloudflare faster. It combines ATProto OAuth + XRPC, Lexicon validation, Jetstream firehose ingestion, edge caching (tags + revalidation), and session management into a single cohesive flow.

Highlights:

- Unified auth & XRPC client restoration per request.
- Durable Object Jetstream consumer with reconnect + cursor persistence.
- Tag-based edge caching & selective revalidation.
- Simple contexts: `getSession()`, `getAtprotoClient()`, `getRequest()`.
- One Vite plugin (`protoflare()`) sets up streaming + prerender environments.
- Included template (`templates/statusphere`) shows profiles, real-time feed, publishing.

Key exports: `protoflare/server`, `protoflare/client`, `protoflare/entry.browser`, `protoflare/entry.ssr`, `protoflare/vite`.

Install template:

```bash
npx giget@latest gh:jacob-ebey/protoflare/templates/statusphere
```

Migrate DB:

```bash
pnpm db:migrate
```

Run:

```bash
pnpm dev
```

Update lexicons:

```bash
pnpm lexgen
```

Refresh worker types:

```bash
pnpm typegen
```

License: ISC

Protoflare – cache, stream & ship ATProto at the edge.
