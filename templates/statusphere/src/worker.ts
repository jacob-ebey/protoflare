import { handleRequest } from "protoflare/server";

import { AtpBaseClient } from "~/lexicons";
import {
  oauthCallbackPathname,
  oauthClientMeatadataPathname,
  routes,
} from "~/routes";
export { FirehoseListener } from "~/storage/firehose";
export { PDS, RepoStorage } from "~/storage/pds";

declare global {
  namespace ProtoflareServer {
    export interface XrpcClient extends AtpBaseClient {}
  }
}

export default {
  async fetch(request, env, ctx) {
    if (import.meta.env.DEV) {
      // Ensure the FirehoseListener DO is started in dev mode. In prod, it starts after the first
      // login to reduce unnecessary requests to it, and restarting is handled via alarms.
      ctx.waitUntil(env.FIREHOSE_LISTENER.getByName("main").getLastEventTime());
    }

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
