import { AsyncLocalStorage } from "node:async_hooks";

import { FetchHandler, FetchHandlerOptions, XrpcClient } from "@atproto/xrpc";

import { AtprotoOAuthClient } from "./atproto-oauth-client";
import { getSession } from "./session";

const asyncAtprotoStorage = new AsyncLocalStorage<AtprotoOAuthClient>();

export const provideAtProtoContext = async (
  {
    AtpBaseClient,
    namespace,
    oauthCallbackPathname,
    oauthClientMeatadataPathname,
    request,
  }: {
    AtpBaseClient: new (
      options: FetchHandler | FetchHandlerOptions,
    ) => XrpcClient;
    namespace: KVNamespace<string>;
    oauthCallbackPathname: string;
    oauthClientMeatadataPathname: string;
    request: Request;
  },
  next: () => Promise<Response> | Response,
): Promise<Response> => {
  const oauthClient = new AtprotoOAuthClient({
    AtpBaseClient,
    callbackPathname: oauthCallbackPathname,
    clientMetadataPathname: oauthClientMeatadataPathname,
    clientMetadata: {
      client_name: "AtprotoTest",
      client_uri: new URL("/", request.url).href,
      scope: "atproto transition:generic",
    },
    namespace,
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
