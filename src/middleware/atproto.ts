import { env } from "cloudflare:workers";
import { AsyncLocalStorage } from "node:async_hooks";

import type { MiddlewareFunction } from "react-router";

import { AtprotoOAuthClient } from "~/lib/atproto-oauth-client";
import { AtpBaseClient } from "~/lexicons";
import { getSession } from "./session";

export const oauthCallbackPathname = "/oauth/callback";
export const oauthClientMeatadataPathname = "/oauth/client-metadata.json";

const asyncAtprotoStorage = new AsyncLocalStorage<
  AtprotoOAuthClient<AtpBaseClient>
>();

export const atprotoMiddleware: MiddlewareFunction = async (
  { request },
  next,
) => {
  const oauthClient = new AtprotoOAuthClient({
    AtpBaseClient,
    callbackPathname: oauthCallbackPathname,
    clientMetadataPathname: oauthClientMeatadataPathname,
    clientMetadata: {
      client_name: "AtprotoTest",
      client_uri: new URL("/", request.url).href,
      scope: "atproto transition:generic",
    },
    namespace: env.OAUTH_STORAGE,
    request,
  });

  const session = getSession();
  const user = session?.get("user");
  if (user) {
    await oauthClient
      .restore(user.did, { signal: request.signal })
      .catch(() => {
        session?.unset("user");
      });
  }

  return await asyncAtprotoStorage.run(oauthClient, next);
};

export function getAtprotoClient() {
  const client = asyncAtprotoStorage.getStore();
  if (!client) {
    throw new Error("Atproto client not available");
  }
  return client;
}
