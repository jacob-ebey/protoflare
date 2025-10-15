import { protoflare } from "protoflare/vite";
import { defineConfig } from "vite";
import devtools from "vite-plugin-devtools-json";
import { useCachePlugin } from "vite-plugin-react-use-cache";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [protoflare(), useCachePlugin(), tsconfigPaths(), devtools()],
});
