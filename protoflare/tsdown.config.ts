import { defineConfig } from "tsdown";

import pkg from "./package.json" with { type: "json" };

export default defineConfig({
  entry: [
    "src/client.ts",
    "src/entry.browser.tsx",
    "src/entry.ssr.tsx",
    "src/server.ts",
    "src/vite.ts",
  ],
  external: ["cloudflare:workers", ...Object.keys(pkg.peerDependencies)],
  dts: true,
});
