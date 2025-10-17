# AT Protocol "Statusphere" Example App

An example application covering:

- Signin via OAuth
- Fetch information about users (profiles)
- Listen to the network firehose for new data
- Publish data on the user's account using a custom schema

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

## Changing the Lexicons

After modifying or adding lexicons, run:

```sh
pnpm lexgen
```

## Modifying wrangler.jsonc

After modifying `wrangler.jsonc`, run:

```sh
pnpm typegen
```
