import * as path from "node:path";

import { protoflare } from "protoflare/vite";
import { defineConfig } from "vite";
import devtools from "vite-plugin-devtools-json";
import tsconfigPaths from "vite-tsconfig-paths";

import pkg from "./package.json" with { type: "json" };

export default defineConfig({
  plugins: [protoflare(), tsconfigPaths(), devtools()],
  resolve: {
    alias: {
      "react-aria-components": path.resolve(
        __dirname,
        "vendor/react-aria-components.ts",
      ),
      "npm:react-aria-components": import.meta.resolve("react-aria-components"),
    },
  },
  optimizeDeps: {
    include: ["npm:react-aria-components", ...Object.keys(pkg.dependencies)],
  },
});
