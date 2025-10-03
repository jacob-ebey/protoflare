import { protoflare } from "protoflare/vite";
import { defineConfig } from "vite";
import devtools from "vite-plugin-devtools-json";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [protoflare(), tsconfigPaths(), devtools()],
});
