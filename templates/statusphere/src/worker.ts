import { handleRequest } from "protoflare/server";
import { provideCache } from "vite-plugin-react-use-cache/runtime";
import { createUnstorageCache } from "vite-plugin-react-use-cache/unstorage";
import { createStorage } from "unstorage";
import createCloudflareKvDriver from "unstorage/drivers/cloudflare-kv-binding";

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

    return provideCache(
      createUnstorageCache(
        createStorage({
          driver: createCloudflareKvDriver({
            binding: env.USE_CACHE,
          }),
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
