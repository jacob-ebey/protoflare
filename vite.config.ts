import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: "127.0.0.1",
  },
  plugins: [
    cloudflare({
      persistState: true,
      viteEnvironment: { name: "ssr" },
    }),
  ],
});
