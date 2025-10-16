import { handleRequest } from "protoflare/server";

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

    return handleRequest({
      AtpBaseClient,
      authNamespace: env.OAUTH_STORAGE,
      oauthCallbackPathname,
      oauthClientMeatadataPathname,
      request,
      routes,
      sessionSecrets: [env.SESSION_SECRET],
    });
  },
} satisfies ExportedHandler<Env>;
