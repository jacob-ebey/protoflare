import { waitUntil } from "cloudflare:workers";

import {
  didDocumentValidator,
  oauthParResponseSchema,
  oauthTokenResponseSchema,
} from "@atproto/oauth-client";
import {
  isLoopbackHost,
  OAuthClientMetadataInput,
  oauthProtectedResourceMetadataSchema,
} from "@atproto/oauth-types";
import { ensureValidDid } from "@atproto/syntax";
import {
  XrpcClient,
  type FetchHandler,
  type FetchHandlerOptions,
} from "@atproto/xrpc";
import * as DPOP from "dpop";

import { dpopFetch } from "./dpop-fetch";

type StoredAuthState = {
  authServer: string;
  did: string;
  dpopNonce: string;
  handle: string;
  serviceEndpoint: string;
  verifier: string;
};

type UserState = {
  authServer: string;
  dpopNonce: string;
  handle: string;
  privateKey: JsonWebKey;
  publicKey: JsonWebKey;
  refreshToken?: string;
  serviceEndpoint: string;
};

export type ClientState = {
  accessToken: string;
  authServer: string;
  did: string;
  dpopNonce: string;
  handle: string;
  keypair: DPOP.KeyPair;
  refreshToken?: string;
  serviceEndpoint: string;
};

type User = {
  did: string;
  handle: string;
  serviceEndpoint: string;
};

export class AtprotoOAuthClient<Client extends XrpcClient> {
  #xrpc: Client;
  #namespace: KVNamespace;
  #clientId: string;
  #redirectURI: string;
  callbackPathname: string;
  clientMetadataPathname: string;
  clientMetadata: OAuthClientMetadataInput;
  state?: ClientState;
  url: string;

  get xrpc() {
    return this.#xrpc;
  }

  constructor({
    AtpBaseClient,
    callbackPathname,
    clientMetadataPathname,
    clientMetadata,
    namespace,
    request,
  }: {
    AtpBaseClient: new (options: FetchHandler | FetchHandlerOptions) => Client;
    callbackPathname: string;
    clientMetadataPathname: string;
    clientMetadata: Omit<
      OAuthClientMetadataInput,
      "client_id" | "redirect_uris" | "application_type"
    >;
    namespace: KVNamespace;
    request: Request;
  }) {
    this.#namespace = namespace;
    this.#clientId = createClientId(
      request,
      callbackPathname,
      clientMetadataPathname,
      clientMetadata.scope,
    );
    this.#redirectURI = getRedirectURI(request, callbackPathname);

    this.clientMetadata = {
      ...clientMetadata,
      application_type: "web",
      client_id: this.#clientId,
      redirect_uris: [this.#redirectURI],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
      dpop_bound_access_tokens: true,
    };
    this.callbackPathname = callbackPathname;
    this.clientMetadataPathname = clientMetadataPathname;
    this.url = request.url;

    this.#xrpc = new AtpBaseClient({
      service: () => {
        if (!this.state?.serviceEndpoint) return "https://public.api.bsky.app/";
        return this.state.serviceEndpoint;
      },
      fetch: (input, init) => {
        if (this.state) {
          return this.dpopFetch({
            createRequest: () => new Request(input, init),
          });
        }
        return fetch(input, init);
      },
    });
  }

  async restore(
    did: string,
    { signal }: { signal?: AbortSignal } = {},
  ): Promise<User> {
    const [userState, accessToken] = await Promise.all([
      this.#namespace
        .get(`user-${did}`)
        .then((userState) =>
          userState ? (JSON.parse(userState) as UserState) : null,
        ),
      this.#namespace.get(`access-token-${did}`),
    ]);
    if (!userState) {
      throw new Error("Unable to find user state");
    }

    const {
      authServer,
      dpopNonce,
      handle,
      privateKey,
      publicKey,
      refreshToken,
      serviceEndpoint,
    } = userState;
    const keypair = await restoreKeyPair(privateKey, publicKey);

    if (!accessToken) {
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const [newDpopNonce, tokenResponse] = await dpopFetch({
        createRequest: () =>
          new Request(new URL("/oauth/token", authServer), {
            method: "POST",
            body: new URLSearchParams({
              client_id: this.#clientId,
              grant_type: "refresh_token",
              refresh_token: refreshToken,
            }),
            signal,
          }),
        keypair,
        nonce: dpopNonce,
      });

      const token = oauthTokenResponseSchema.parse(await tokenResponse.json());
      if (!newDpopNonce) {
        throw new Error("Failed to get dpop nonce");
      }

      await Promise.all([
        this.#namespace.put(`access-token-${did}`, token.access_token, {
          expirationTtl: token.expires_in,
        }),
        this.#namespace.put(
          `user-${did}`,
          JSON.stringify({
            ...userState,
            dpopNonce: newDpopNonce,
            refreshToken: token.refresh_token,
          } satisfies UserState),
        ),
      ]);

      this.state = {
        accessToken: token.access_token,
        authServer,
        did,
        dpopNonce: newDpopNonce,
        handle,
        keypair,
        serviceEndpoint,
        refreshToken: token.refresh_token,
      };
      return { did, handle, serviceEndpoint };
    }

    this.state = {
      accessToken,
      authServer,
      did,
      dpopNonce,
      handle,
      keypair,
      serviceEndpoint,
      refreshToken,
    };
    return { did, handle, serviceEndpoint };
  }

  async authorize(
    handle: string,
    { signal }: { signal?: AbortSignal } = {},
  ): Promise<URL> {
    const didDoc = await resolveDidFromHandle(handle, { signal }).then((did) =>
      resolveDidDocument(did, { signal }),
    );
    const pds = didDoc.service?.find(
      (service) =>
        service.type === "AtprotoPersonalDataServer" &&
        typeof service.serviceEndpoint === "string" &&
        service.serviceEndpoint.startsWith("https://"),
    ) as { serviceEndpoint: string } | undefined;
    if (!pds) {
      throw new Error("Unable to find AtprotoPersonalDataServer service");
    }

    const { authorization_servers = [] } =
      await getOAuthProtectedResourceMetadata(pds.serviceEndpoint, {
        signal,
      });
    const authServer = authorization_servers.find(
      (server) => server && server.startsWith("https://"),
    );
    if (!authServer) {
      throw new Error("Unable to find authorization server");
    }

    const state = (crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, "");

    const verifier = generateVerifier();

    const par = await this.pushAuthorization({
      authServer,
      handle,
      signal,
      state,
      verifier,
    });

    await this.#namespace.put(
      `state-${state}`,
      JSON.stringify({
        authServer,
        did: didDoc.id,
        dpopNonce: par.dpopNonce,
        handle,
        serviceEndpoint: pds.serviceEndpoint,
        verifier,
      } satisfies StoredAuthState),
      {
        expirationTtl: par.expires_in,
      },
    );

    const redirectURL = new URL("/oauth/authorize", authServer);
    redirectURL.searchParams.set("client_id", this.#clientId);
    redirectURL.searchParams.set("request_uri", par.request_uri);
    return redirectURL;
  }

  async exchange(
    {
      code,
      issuer,
      state,
    }: {
      code: string;
      issuer: string;
      state: string;
    },
    { signal }: { signal?: AbortSignal } = {},
  ): Promise<User> {
    const storedState = await this.#namespace
      .get(`state-${state}`)
      .then((state) => (state ? (JSON.parse(state) as StoredAuthState) : null))
      .catch(() => null);

    await this.#namespace.delete(`state-${state}`)?.catch(() => {});

    if (!storedState?.verifier) {
      throw new Error("Unable to find state");
    }

    const { authServer, did, dpopNonce, handle, serviceEndpoint, verifier } =
      storedState;

    if (authServer !== issuer) {
      throw new Error("Invalid issuer");
    }

    let keypair = await DPOP.generateKeyPair("ES256", { extractable: true });
    const privateKeyPromise = crypto.subtle.exportKey(
      "jwk",
      keypair.privateKey,
    );
    const publicKeyPromise = crypto.subtle.exportKey("jwk", keypair.publicKey);
    if (signal?.aborted) throw signal.reason;

    const [newDpopNonce, tokenResponse] = await dpopFetch({
      createRequest: () =>
        new Request(new URL("/oauth/token", authServer), {
          method: "POST",
          body: new URLSearchParams({
            client_id: this.#clientId,
            code,
            code_verifier: verifier,
            grant_type: "authorization_code",
            redirect_uri: this.#redirectURI,
          }),
          signal,
        }),
      keypair,
      nonce: dpopNonce,
      retry: false,
    });
    if (!newDpopNonce) {
      throw new Error("Failed to get dpop nonce");
    }

    const token = oauthTokenResponseSchema.parse(await tokenResponse.json());

    await Promise.all([
      this.#namespace.delete(`state-${state}`),
      this.#namespace.put(`access-token-${did}`, token.access_token, {
        expirationTtl: token.expires_in,
      }),
      this.#namespace.put(
        `user-${did}`,
        JSON.stringify({
          authServer,
          dpopNonce: newDpopNonce,
          handle,
          privateKey: await privateKeyPromise,
          publicKey: await publicKeyPromise,
          refreshToken: token.refresh_token,
          serviceEndpoint,
        } satisfies UserState),
      ),
    ]);

    this.state = {
      accessToken: token.access_token,
      authServer,
      did,
      dpopNonce: newDpopNonce,
      handle,
      keypair,
      serviceEndpoint,
      refreshToken: token.refresh_token,
    };

    return { did, handle, serviceEndpoint };
  }

  async dpopFetch({
    createRequest,
    retry,
  }: {
    createRequest: (args: {
      did: string;
      handle: string;
      serviceEndpoint: string;
    }) => Request;
    retry?: boolean;
  }) {
    const state = this.state;
    if (!state) {
      throw new Error("No state available");
    }

    const [newDpopNonce, response] = await dpopFetch({
      createRequest: () =>
        createRequest({
          did: state.did,
          handle: state.handle,
          serviceEndpoint: state.serviceEndpoint,
        }),
      accessToken: state.accessToken,
      keypair: state.keypair,
      nonce: state.dpopNonce,
      retry,
    });
    if (newDpopNonce && newDpopNonce !== state.dpopNonce) {
      if (this.state) {
        this.state.dpopNonce = newDpopNonce;
      }
      waitUntil(
        (async () => {
          const privateKeyPromise = crypto.subtle.exportKey(
            "jwk",
            state.keypair.privateKey,
          );
          const publicKeyPromise = crypto.subtle.exportKey(
            "jwk",
            state.keypair.publicKey,
          );

          await this.#namespace.put(
            `user-${state.did}`,
            JSON.stringify({
              authServer: state.authServer,
              dpopNonce: newDpopNonce,
              handle: state.handle,
              privateKey: await privateKeyPromise,
              publicKey: await publicKeyPromise,
              refreshToken: state.refreshToken,
              serviceEndpoint: state.serviceEndpoint,
            } satisfies UserState),
          );
        })(),
      );
    }
    return response;
  }

  private async pushAuthorization({
    authServer,
    handle,
    signal,
    state,
    verifier,
  }: {
    authServer: string;
    handle: string;
    signal?: AbortSignal;
    state: string;
    verifier: string;
  }) {
    const challenge = await createChallenge(verifier);

    const body = new URLSearchParams();
    for (const [key, value] of Object.entries(this.clientMetadata)) {
      if (Array.isArray(value)) {
        for (const v of value) {
          body.append(key, v);
        }
      } else {
        body.set(key, String(value));
      }
    }
    body.set("response_type", "code");
    body.set("code_challenge", challenge);
    body.set("code_challenge_method", "S256");
    body.set("state", state);
    body.set("login_hint", handle);

    const { dpopNonce, ok, pushAuthorizationPromise } = await fetch(
      new URL("/oauth/par", authServer),
      {
        method: "POST",
        body,
        signal,
      },
    ).then((res) => ({
      ok: res.ok,
      dpopNonce: res.headers.get("DPoP-Nonce"),
      pushAuthorizationPromise: res.json().catch(() => null),
    }));

    let pushAuthorization: unknown | null;
    if (!ok || !(pushAuthorization = await pushAuthorizationPromise)) {
      console.error(await pushAuthorizationPromise);
      throw new Error("Failed to push authorization");
    }

    if (!dpopNonce) {
      throw new Error("Failed to get DPoP nonce");
    }

    const parsed = oauthParResponseSchema.parse(pushAuthorization);
    return { ...parsed, dpopNonce };
  }
}

function createClientId(
  request: Request,
  callbackPathname: string,
  clientMetadataPathname: string,
  scope?: string,
) {
  let clientId: string;
  const requestURL = new URL(request.url);
  if (isLoopbackHost(requestURL.hostname)) {
    const redirectURI = new URL(
      callbackPathname,
      `http://127.0.0.1:${requestURL.port}`,
    ).href;
    const clientIdURL = new URL("/", "http://localhost");
    clientIdURL.searchParams.set("redirect_uri", redirectURI);
    if (scope) clientIdURL.searchParams.set("scope", scope);
    clientId = clientIdURL.href;
  } else {
    clientId = new URL(clientMetadataPathname, request.url).href;
  }
  return clientId;
}

function getRedirectURI(request: Request, callbackPathname: string) {
  const requestURL = new URL(request.url);
  return new URL(
    callbackPathname,
    isLoopbackHost(requestURL.hostname)
      ? `http://127.0.0.1:${requestURL.port}`
      : request.url,
  ).href;
}

async function resolveDidFromHandle(
  handle: string,
  { signal }: { signal?: AbortSignal },
) {
  const url = new URL("/.well-known/atproto-did", `https://${handle}`);
  const { ok, didPromise } = await fetch(url, {
    cf: {
      cacheTtl: 300,
    },
    signal,
  }).then((res) => ({
    ok: res.ok,
    didPromise: res.text().catch(() => null),
  }));
  let did: string | null | undefined;
  if (!ok || !(did = await didPromise)) {
    const bskyURL = new URL(
      "https://bsky.social/xrpc/com.atproto.identity.resolveHandle",
    );
    bskyURL.searchParams.set("handle", handle);
    did = (await (await fetch(bskyURL)).json<{ did?: string }>())?.did;
  }
  if (!did) {
    throw new Error(`Failed to resolve DID from ${url.href}`);
  }
  ensureValidDid(did);
  return did;
}

async function resolveDidDocument(
  did: string,
  { signal }: { signal?: AbortSignal },
) {
  const { ok, documentPromise } = await fetch(`https://plc.directory/${did}`, {
    cf: {
      cacheTtl: 300,
    },
    signal,
  }).then((res) => ({
    ok: res.ok,
    documentPromise: res.json().catch(() => null),
  }));

  let document: unknown | null;
  if (!ok || !(document = await documentPromise)) {
    throw new Error(`Failed to resolve DID document from ${did}`);
  }

  return didDocumentValidator.parse(document);
}

async function getOAuthProtectedResourceMetadata(
  serviceEndpoint: string,
  { signal }: { signal?: AbortSignal },
) {
  const oauthEndpoint = new URL(
    "/.well-known/oauth-protected-resource",
    serviceEndpoint,
  );
  const { ok, oauthProtectedResourceMetadataPromise } = await fetch(
    oauthEndpoint,
    {
      cf: {
        cacheTtl: 300,
      },
      signal,
    },
  ).then((res) => ({
    ok: res.ok,
    oauthProtectedResourceMetadataPromise: res.json().catch(() => null),
  }));

  let oauthProtectedResourceMetadata: unknown | null;
  if (
    !ok ||
    !(oauthProtectedResourceMetadata =
      await oauthProtectedResourceMetadataPromise)
  ) {
    throw new Error(
      `Failed to resolve OAuth protected resource metadata from ${oauthEndpoint.href}`,
    );
  }

  return oauthProtectedResourceMetadataSchema.parse(
    oauthProtectedResourceMetadata,
  );
}

function base64(bytes: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}

function base64URLEncode(bytes: ArrayBuffer) {
  return base64(bytes)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function generateVerifier() {
  return base64URLEncode(crypto.getRandomValues(new Uint8Array(32)).buffer);
}

async function sha256(data: string) {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
}

async function createChallenge(verifier: string) {
  return base64URLEncode(await sha256(verifier));
}

async function restoreKeyPair(
  privateJSONKey: JsonWebKey,
  publicJSONKey: JsonWebKey,
) {
  const [privateKey, publicKey] = await Promise.all([
    crypto.subtle.importKey(
      "jwk",
      privateJSONKey,
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["sign"],
    ),
    crypto.subtle.importKey(
      "jwk",
      publicJSONKey,
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["verify"],
    ),
  ]);
  return { privateKey, publicKey };
}
