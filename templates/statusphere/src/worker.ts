import { handleRequest } from "protoflare/server";
import { provideCache } from "vite-plugin-react-use-cache/runtime";
import { createUnstorageCache } from "vite-plugin-react-use-cache/unstorage";
import { createStorage } from "unstorage";

import { AtpBaseClient } from "~/lexicons";
import {
  oauthCallbackPathname,
  oauthClientMeatadataPathname,
  routes,
} from "~/routes";

export { JetstreamConsumer } from "~/storage/jetstream";

declare global {
  namespace ProtoflareServer {
    // Provide your lexicon so that getAtprotoClient().xrpc is typed correctly
    export interface XrpcClient extends AtpBaseClient {}

    // Add additional typesafe keys to getSession() methods
    export interface SessionData {}
  }
}

export default {
  async fetch(request, env) {
    if (!env.SESSION_SECRET) {
      console.error("SESSION_SECRET is not set");
      throw new Error("SESSION_SECRET is not set");
    }

    const openCache = caches.open("use-cache");

    return provideCache(
      createUnstorageCache(
        createStorage({
          driver: {
            async getItem(key) {
              const cache = await openCache;
              const response = await cache.match(
                new Request(new URL(key, "https://use-cache.com")),
                {
                  ignoreMethod: true,
                },
              );
              return response ? await response.json() : null;
            },
            async setItem(key, value) {
              const cache = await openCache;
              const response = new Response(JSON.stringify(value), {
                headers: {
                  "Content-Type": "application/json",
                  "Cache-Control": "max-age=15552000",
                },
              });
              await cache.put(
                new Request(new URL(key, "https://use-cache.com")),
                response,
              );
            },
            async hasItem(key) {
              const cache = await openCache;
              const response = await cache.match(
                new Request(new URL(key, "https://use-cache.com")),
                {
                  ignoreMethod: true,
                },
              );
              return response !== undefined;
            },
            async getKeys() {
              const cache = await openCache;
              const keys = await cache.keys();
              return keys.map((request) => {
                const url = new URL(request.url);
                return url.pathname + url.search + url.hash;
              });
            },
            async removeItem(key) {
              const cache = await openCache;
              await cache.delete(
                new Request(new URL(key, "https://use-cache.com")),
              );
            },
            async clear() {
              await caches.delete("use-cache");
            },
          },
        }),
      ),
      () =>
        handleRequest({
          AtpBaseClient,
          authNamespace: env.OAUTH_STORAGE,
          oauthCallbackPathname,
          oauthClientMeatadataPathname,
          request,
          routes,
          sessionSecrets: [env.SESSION_SECRET],
        }),
    );
  },
} satisfies ExportedHandler<Env>;
