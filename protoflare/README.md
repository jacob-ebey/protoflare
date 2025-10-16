# Protoflare

Protoflare helps you build AT Protocol apps on Cloudflare faster. It combines ATProto OAuth + XRPC, Lexicon validation, Jetstream firehose ingestion, edge caching (tags + revalidation), and session management into a single cohesive flow.

Highlights:

- Unified auth & XRPC client restoration per request.
- Durable Object Jetstream consumer with reconnect + cursor persistence.
- Tag-based edge caching & selective revalidation.
- Simple contexts: `getSession()`, `getAtprotoClient()`, `getRequest()`.
- One Vite plugin (`protoflare()`) sets up streaming + prerender environments.
- Included template (`templates/statusphere`) shows profiles, real-time feed, publishing.

## Getting Started

Download template:

```sh
npx giget@latest gh:jacob-ebey/protoflare/templates/statusphere
```

Install dependencies:

```sh
pnpm i
```

Configure environment variables:

```sh
cp .env.example .env
```

Migrate the database:

```sh
pnpm db:migrate
```

Run the development server:

```sh
pnpm dev
```
