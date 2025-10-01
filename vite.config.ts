import { cloudflare } from "@cloudflare/vite-plugin";
import react from "@vitejs/plugin-react";
import rsc from "@vitejs/plugin-rsc";
import { defineConfig } from "vite";
import devtools from "vite-plugin-devtools-json";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  server: {
    host: "127.0.0.1",
  },
  plugins: [
    cloudflare({
      persistState: true,
      viteEnvironment: { name: "rsc" },
    }),
    react(),
    rsc({
      entries: {
        client: "./src/framework/entry.browser.tsx",
        ssr: "./src/framework/entry.ssr.tsx",
      },
      serverHandler: false,
      loadModuleDevProxy: true,
    }),
    tsconfigPaths(),
    devtools(),
  ],
  environments: {
    client: {
      optimizeDeps: {
        include: ["react-router/internal/react-server-client"],
      },
    },
    rsc: {
      build: {
        rollupOptions: {
          preserveEntrySignatures: "exports-only",
        },
      },
      optimizeDeps: {
        include: ["react-router > cookie", "react-router > set-cookie-parser"],
        exclude: ["cloudflare:workers", "react-router"],
      },
      resolve: {
        noExternal: true,
      },
    },
    ssr: {
      keepProcessEnv: false,
      build: {
        // build `ssr` inside `rsc` directory so that
        // wrangler can deploy self-contained `dist/rsc`
        outDir: "./dist/rsc/ssr",
      },
      optimizeDeps: {
        include: ["react-router/internal/react-server-client"],
      },
      resolve: {
        noExternal: true,
      },
    },
  },
});
