import * as sentry from "@sentry/cloudflare";
import { handleRequest } from "protoflare/server";

import { AtpBaseClient } from "#lexicons";
import {
  oauthCallbackPathname,
  oauthClientMeatadataPathname,
  routes,
} from "#routes";
import { JetstreamConsumer as JetstreamConsumerDO } from "#storage/jetstream";

declare global {
  namespace ProtoflareServer {
    // Provide your lexicon so that getAtprotoClient().xrpc is typed correctly
    export interface XrpcClient extends AtpBaseClient {}

    // Add additional typesafe keys to getSession() methods
    export interface SessionData {}
  }
}

function sentryOptions(environment: string) {
  return (env: Env): sentry.CloudflareOptions => ({
    environment,
    dsn: env.SENTRY_DSN,
    release: env.CF_VERSION_METADATA.id,
    tracesSampleRate: 1.0,
    enableLogs: true,
    sendDefaultPii: false,
    integrations: [
      sentry.consoleLoggingIntegration(),
      sentry.eventFiltersIntegration(),
    ],
  });
}

export const JetstreamConsumer = sentry.instrumentDurableObjectWithSentry(
  sentryOptions("JetstreamConsumer"),
  JetstreamConsumerDO,
);

export default sentry.withSentry<Env>(sentryOptions("worker"), {
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
      routeDiscovery: "lazy",
      sessionSecrets: [env.SESSION_SECRET],
    });
  },
} satisfies ExportedHandler<Env>);
