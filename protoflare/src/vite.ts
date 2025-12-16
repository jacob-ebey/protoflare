import {
  cloudflare,
  type PluginConfig as CloudflareConfig,
} from "@cloudflare/vite-plugin";
import react, { type Options as ReactOptions } from "@vitejs/plugin-react";
import rsc, { type RscPluginOptions } from "@vitejs/plugin-rsc";
import { mergeConfig, type PluginOption } from "vite";
import { useCachePlugin } from "vite-plugin-react-use-cache";

export function protoflare({
  cloudflare: cloudflareConfig,
  react: reactConfig,
  rsc: rscConfig,
}: {
  cloudflare?: CloudflareConfig;
  react?: ReactOptions;
  rsc?: RscPluginOptions;
} = {}): PluginOption {
  return [
    cloudflare({
      persistState: true,
      viteEnvironment: { name: "rsc" },
      ...cloudflareConfig,
    }),
    react(reactConfig),
    rsc({
      ...rscConfig,
      entries: {
        client: "protoflare/entry.browser",
        ssr: "protoflare/entry.ssr",
        ...rscConfig?.entries,
      },
      serverHandler: false,
      loadModuleDevProxy: true,
    }),
    useCachePlugin(),
    {
      name: "protoflare",
      config(userConfig) {
        return mergeConfig(
          userConfig,
          {
            server: {
              host: "127.0.0.1",
            },
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
                  include: [
                    "react/jsx-runtime",
                    "react/jsx-dev-runtime",
                    "protoflare/server",
                    "react-router/internal/react-server-client",
                    "react-router > cookie",
                    "react-router > set-cookie-parser",
                    "vite-plugin-react-use-cache/runtime",
                  ],
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
                  include: [
                    "react/jsx-runtime",
                    "react/jsx-dev-runtime",
                    "react-router",
                    "react-router/internal/react-server-client",
                  ],
                },
                resolve: {
                  noExternal: true,
                },
              },
            },
          },
          true,
        );
      },
    },
  ];
}
