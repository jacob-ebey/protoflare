import { handleRequest } from "protoflare/server";

import {
  instrument,
  isRequest,
  type ResolveConfigFn,
} from "@microlabs/otel-cf-workers";
import { AtpBaseClient } from "#lexicons";
import {
  oauthCallbackPathname,
  oauthClientMeatadataPathname,
  routes,
} from "#routes";

export { JetstreamConsumer } from "#storage/jetstream";

declare global {
  namespace ProtoflareServer {
    // Provide your lexicon so that getAtprotoClient().xrpc is typed correctly
    export interface XrpcClient extends AtpBaseClient {}

    // Add additional typesafe keys to getSession() methods
    export interface SessionData {}
  }
}

const otelConfig: ResolveConfigFn<Env> = (env, trigger) => {
  const baseName = "at-garden-club";
  const name = isRequest(trigger) ? baseName : `${baseName}:JetstreamConsumer`;

  // Safe default: if no exporter is configured, record nothing and export nothing.
  if (!env.HONEYCOMB_API_KEY) {
    return {
      exporter: {
        async export() {},
        async shutdown() {},
        async forceFlush() {},
      },
      sampling: { headSampler: { ratio: 0 }, tailSampler: () => false },
      service: { name },
    };
  }

  return {
    exporter: {
      url: "https://api.honeycomb.io/v1/traces",
      headers: { "x-honeycomb-team": env.HONEYCOMB_API_KEY },
    },
    service: { name },
  };
};

const handler = {
  async fetch(request, env) {
    if (!env.SESSION_SECRET) {
      console.error("SESSION_SECRET is not set");
      throw new Error("SESSION_SECRET is not set");
    }

    const url = new URL(request.url);
    const hydrate =
      url.pathname === "/contribute" || url.pathname === "/styles";

    return handleRequest({
      AtpBaseClient,
      authNamespace: env.OAUTH_STORAGE,
      hydrate,
      oauthCallbackPathname,
      oauthClientMeatadataPathname,
      request,
      routes,
      sessionSecrets: [env.SESSION_SECRET],
    });
  },
} satisfies ExportedHandler<Env>;

export default instrument(handler, otelConfig);
