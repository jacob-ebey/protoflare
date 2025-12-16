# 🌸 AT Garden Club - A Decentralized CSS Showcase

Welcome to **AT Garden Club**, where the legendary spirit of CSS Zen Garden meets the decentralized future of the AT Protocol!

In 2003, [Dave Shea](http://daveshea.com/projects/zen/) began the legendary [CSS Zen Garden](http://www.csszengarden.com/) project that demonstrated "what can be accomplished through CSS-based design" until submissions stopped in 2013. [Stephanie Eckles](https://bsky.app/profile/5t3ph.bsky.social) rekindled that spirit with [Style Stage](https://stylestage.dev/) by providing a modern base HTML for contributors to re-style by submitting alternate stylesheets.

**AT Garden Club** takes this vision further by **decentralizing submissions through the AT Protocol**, allowing submitters to completely own their data. Your creative work, your data, your control.

## ✨ What Makes This Special?

- 🔐 **OAuth-based authentication** - Secure sign-in via the AT Protocol
- 👤 **User profiles** - Fetch and display information about contributors
- 🌊 **Real-time network firehose** - Listen for new submissions as they happen
- 📝 **Custom schema publishing** - Publish your stylesheets to your own PDS using our custom lexicon
- 🎨 **Full creative control** - Your submissions live on YOUR personal data server

Modern CSS has given us incredible tools - Flexbox, Grid, custom variables, animations, and so much more. Join us to refresh your CSS skills, showcase your creativity, and learn from a community of passionate CSS practitioners!

## 🚀 Getting Started

### Install Dependencies

```sh
pnpm i
```

### Configure Environment Variables

```sh
cp .env.example .env
```

### Migrate the Database

```sh
pnpm db:migrate
```

### Run the Development Server

```sh
pnpm dev
```

Now visit your local instance and start exploring! 🎉

## 🛠️ Development Workflows

### Changing the Lexicons

After modifying or adding lexicons to define your custom AT Protocol schemas, run:

```sh
pnpm lexgen
```

### Modifying wrangler.jsonc

After modifying `wrangler.jsonc` for your Cloudflare Workers configuration, run:

```sh
pnpm typegen
```

## 📦 Working with 3rd Party Components

Most 3rd party component libraries are not marked as `"use client"` and should be. The pattern we use is to create a `vendor/vendor-name.ts` file and re-export used items from there, then alias it within the `vite.config.ts`.

**Example consuming `comp-lib`:**

```ts
// vendor/comp-lib.ts
export { Component } from "npm:comp-lib";

// vite.config.ts
alias: {
  "npm:comp-lib": import.meta.resolve("comp-lib"),
}
```

## 🎨 How to Contribute a Style

All who enjoy the craft of writing CSS are welcome to contribute!

1. **Explore** - Browse the current submissions to see what's possible
2. **Create** - Design your stylesheet using the source HTML as your canvas
3. **Submit** - Sign in with your AT Protocol account and upload your creation
4. **Own** - Your submission is stored on YOUR PDS, giving you complete ownership

Check out the [Style Stage guidelines](https://stylestage.dev/contribute/) for detailed contribution requirements, or visit the `/contribute` page on your running instance.

## 🌟 What You'll Learn

This project is a comprehensive example covering:

- **Authentication flows** - Implementing OAuth with the AT Protocol
- **Profile management** - Working with user data and DIDs
- **Firehose integration** - Real-time event streaming from the AT network
- **Custom lexicons** - Defining and using your own data schemas
- **Data ownership** - True decentralization where users control their content

## 🎯 The Vision

AT Garden Club isn't just about beautiful CSS (though we love that!). It's about demonstrating what's possible when we combine creative expression with true data ownership. Every stylesheet submitted lives on the contributor's own personal data server. This is the web as it should be - open, creative, and truly yours.

**Have fun and learn something new!** Modern CSS is more powerful than ever, and the AT Protocol gives us the infrastructure to build truly decentralized creative communities.

---

Built with 💜 by the community, powered by the AT Protocol
