import { DurableObject } from "cloudflare:workers";

import type { Lexicons } from "@atproto/lexicon";
import {
  XrpcClient as BaseXrpcClient,
  FetchHandler,
  FetchHandlerOptions,
} from "@atproto/xrpc";
import {
  createTemporaryReferenceSet,
  decodeAction,
  decodeFormState,
  decodeReply,
  loadServerAction,
  renderToReadableStream,
} from "@vitejs/plugin-rsc/rsc";
import {
  unstable_matchRSCServerRequest as matchRSCServerRequest,
  type unstable_RSCRouteConfig as RSCRouteConfig,
} from "react-router";
import { provideCache } from "vite-plugin-react-use-cache/runtime";
import { createUnstorageCache } from "vite-plugin-react-use-cache/unstorage";
import { createStorage } from "unstorage";

import { provideAtProtoContext } from "./atproto";
import { provideRequestContext } from "./request";
import { provideSessionContext } from "./session";
import { ERROR_BOUNDARY_ERROR, ERROR_DIGEST_BASE } from "./shared";
import {
  deserializeResponse,
  serializeRequestWithoutBody,
  serializeResponse,
} from "./transport-tools";

export {
  cacheLife,
  cacheTag,
  revalidateTag,
} from "vite-plugin-react-use-cache/runtime";

export { getAtprotoClient } from "./atproto";
export {
  AtprotoOAuthClient,
  resolveDidDocument,
  resolveDidFromHandle,
} from "./atproto-oauth-client";
export { getRequest } from "./request";
export { destroySession, getSession } from "./session";

declare global {
  namespace ProtoflareServer {
    export interface XrpcClient extends BaseXrpcClient {}
  }
}

export class BoundaryError extends Error {
  public digest: `${typeof ERROR_DIGEST_BASE}${string}`;

  constructor({
    status,
    statusText,
    data,
  }: {
    status: number;
    statusText?: string;
    data?: unknown;
  }) {
    super(ERROR_DIGEST_BASE);
    this.digest = `${ERROR_DIGEST_BASE}${JSON.stringify([ERROR_BOUNDARY_ERROR, status, statusText, data])}`;
  }
}

export function callServer({
  AtpBaseClient,
  authNamespace,
  oauthCallbackPathname,
  oauthClientMeatadataPathname,
  request,
  routes,
  sessionSecrets,
}: {
  AtpBaseClient: new (
    options: FetchHandler | FetchHandlerOptions,
  ) => ProtoflareServer.XrpcClient;
  authNamespace: KVNamespace<string>;
  oauthCallbackPathname: string;
  oauthClientMeatadataPathname: string;
  request: Request;
  routes: RSCRouteConfig;
  sessionSecrets: string[];
}): Promise<Response> {
  return provideRequestContext(request, () =>
    provideSessionContext({ request, secrets: sessionSecrets }, () =>
      provideAtProtoContext(
        {
          AtpBaseClient,
          namespace: authNamespace,
          oauthCallbackPathname,
          oauthClientMeatadataPathname,
          request,
        },
        () => {
          return matchRSCServerRequest({
            createTemporaryReferenceSet,
            decodeAction,
            decodeFormState,
            decodeReply,
            loadServerAction,
            request,
            routes,
            generateResponse(match, { temporaryReferences }) {
              const headers = new Headers(match.headers);
              headers.set("Content-Type", "text/x-component; charset=utf-8");

              return new Response(
                renderToReadableStream(match.payload, {
                  temporaryReferences,
                  onError(error: unknown) {
                    if (
                      error &&
                      typeof error === "object" &&
                      "digest" in error &&
                      typeof error.digest === "string" &&
                      error.digest.startsWith(`${ERROR_DIGEST_BASE}[`) &&
                      error.digest.endsWith("]")
                    ) {
                      return error.digest;
                    }
                    console.error("Error during RSC render", error);
                  },
                }),
                {
                  status: match.statusCode,
                  headers,
                },
              );
            },
          });
        },
      ),
    ),
  );
}

export async function prerender(request: Request, serverResponse: Response) {
  const ssr = await import.meta.viteRsc.loadModule<
    typeof import("./entry.ssr")
  >("ssr", "index");

  const ssrResponse = await ssr.prerender(
    serializeRequestWithoutBody(request),
    serializeResponse(serverResponse),
  );

  return deserializeResponse(ssrResponse);
}

export async function handleRequest({
  AtpBaseClient,
  authNamespace,
  oauthCallbackPathname,
  oauthClientMeatadataPathname,
  request,
  routes,
  sessionSecrets,
}: {
  AtpBaseClient: new (
    options: FetchHandler | FetchHandlerOptions,
  ) => ProtoflareServer.XrpcClient;
  authNamespace: KVNamespace<string>;
  oauthCallbackPathname: string;
  oauthClientMeatadataPathname: string;
  request: Request;
  routes: RSCRouteConfig;
  sessionSecrets: string[];
}) {
  try {
    let serverResponse: Response;
    try {
      serverResponse = await provideCache(
        createUnstorageCache(
          createStorage({
            driver: createCacheUnstorageDriver({
              cache: caches.open("use-cache"),
            }),
          }),
        ),
        () =>
          callServer({
            AtpBaseClient,
            authNamespace,
            oauthCallbackPathname,
            oauthClientMeatadataPathname,
            request,
            routes,
            sessionSecrets,
          }),
      );
    } catch (error) {
      console.error("Error during RSC handling", error);
      throw error;
    }

    try {
      return await prerender(request, serverResponse);
    } catch (error) {
      console.error("Error during SSR prerender", error);
      throw error;
    }
  } catch {
    return new Response("Internal Server Error", { status: 500 });
  }
}

export type JetStreamMessage<T extends string = string> = {
  did: string;
  time_us: number;
  type: string;
  kind: string;
  commit?: {
    rev: string;
    type: string;
    operation: string;
    collection: T;
    rkey: string;
    record: {
      $type: T;
    };
    cid: string;
  };
};

type LexiconsModule = {
  ids: Record<string, string>;
};

type LexiconIds<Lexicon extends LexiconsModule> =
  Lexicon["ids"][keyof Lexicon["ids"]];

export class JetstreamConsumerDurableObject<
  Lexicon extends LexiconsModule,
  WantedIds extends ReadonlyArray<LexiconIds<Lexicon>>,
> extends DurableObject {
  #lastEventTime: number;
  #websocket: WebSocket | null = null;
  #wantedCollections: Set<WantedIds[number]>;
  #lexicons: Lexicons;
  #handleMessage: (
    message: JetStreamMessage<WantedIds[number]>,
  ) => void | Promise<void>;

  constructor(
    ctx: DurableObjectState,
    env: Cloudflare.Env,
    {
      handleMessage,
      backfillStart,
      lexicons,
      wantedCollections,
    }: {
      handleMessage: (
        message: JetStreamMessage<WantedIds[number]>,
      ) => void | Promise<void>;
      backfillStart?: number;
      lexicons: Lexicons;
      wantedCollections: WantedIds;
    },
  ) {
    super(ctx, env);

    this.#lexicons = lexicons;
    this.#wantedCollections = new Set(wantedCollections);
    this.#handleMessage = handleMessage;

    this.#lastEventTime = 0;
    ctx
      .blockConcurrencyWhile(async () => {
        this.#lastEventTime =
          (await ctx.storage.get<number>("lastEventTime", {
            allowConcurrency: true,
            noCache: true,
          })) ??
          backfillStart ??
          0;
      })
      .then(() =>
        this.#startLoop().catch((reason) =>
          console.error("Failed to start loop: ", reason),
        ),
      );
  }

  getLastEventTime(): number {
    return this.#lastEventTime;
  }

  async alarm() {
    await this.#startLoop().catch((reason) =>
      console.error("Failed to restart loop", reason),
    );
  }

  #saveLastEventTimeQueued = 0;
  #saveLastEventTimeOnATimeout() {
    if (this.#saveLastEventTimeQueued) {
      return;
    }
    this.#saveLastEventTimeQueued++;

    this.ctx.waitUntil(
      new Promise<void>((resolve) => {
        setTimeout(async () => {
          try {
            await this.ctx.storage.put("lastEventTime", this.#lastEventTime);
          } catch (error) {
            console.error("Failed to save lastEventTime:", error);
          } finally {
            this.#saveLastEventTimeQueued = 0;
            resolve();
          }
        }, 1000);
      }),
    );
  }

  async #startLoop() {
    await this.#resetAlarm();

    if (
      this.#websocket &&
      this.#websocket.readyState !== WebSocket.CLOSING &&
      this.#websocket.readyState !== WebSocket.CLOSED
    ) {
      return;
    }

    const url = new URL("wss://jetstream1.us-west.bsky.network/subscribe");
    url.searchParams.set("cursor", String(this.#lastEventTime));
    for (const collection of this.#wantedCollections) {
      url.searchParams.append("wantedCollections", collection);
    }

    console.info("Connecting to ", url.href);
    this.#websocket = new WebSocket(url);
    this.#websocket.addEventListener("open", () => {
      console.info("Connected to Jetstream.");
    });
    this.#websocket.addEventListener("error", (event) => {
      console.error("Got error from WebSocket: ", event);
      this.#websocket = null;
      this.#startLoop();
    });
    this.#websocket.addEventListener("close", (event) => {
      console.warn("WebSocket closed: ", event.reason);
      this.#websocket = null;
      this.#startLoop();
    });
    this.#websocket.addEventListener("message", (event) => {
      try {
        // TODO: decompress with zstd compression dictionary
        const message: JetStreamMessage<WantedIds[number]> = JSON.parse(
          event.data as string,
        );

        this.#lastEventTime = message.time_us;
        this.#saveLastEventTimeOnATimeout();

        if (message.kind === "commit" && message.commit) {
          const uri = `lex:${message.commit.collection}`;
          const lexicon = this.#lexicons.get(uri);
          const valid = lexicon
            ? message.commit.operation === "create"
              ? this.#lexicons.validate(uri, message.commit.record)
              : { success: true }
            : { success: false };

          if (valid.success) {
            (async () => this.#handleMessage(message))().catch((reason) => {
              console.error("Dev failed to handle message", reason);
            });
          }
        }
      } catch (error) {
        console.error("Failed to handle message", error);
      }
    });
  }

  async #resetAlarm() {
    const alarm = await this.ctx.storage.getAlarm();
    // If we have an alarm set that is not in the past then
    // don't set another one.
    if (alarm && alarm - Date.now() > 0) {
      return;
    }

    // Set an alarm 5 seconds in the future to ensure the DO stays alive.
    await this.ctx.storage.setAlarm(Date.now() + 5000);
  }
}

function createCacheUnstorageDriver({
  cache: openCache,
}: {
  cache: Promise<Cache>;
}) {
  return {
    async getItem(key: string) {
      const cache = await openCache;
      const response = await cache.match(
        new Request(new URL(key, "https://use-cache.com")),
        {
          ignoreMethod: true,
        },
      );
      return response ? await response.json() : null;
    },
    async setItem(key: string, value: unknown) {
      const cache = await openCache;
      const response = new Response(JSON.stringify(value), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=15552000",
        },
      });
      await cache.put(
        new Request(new URL(key, "https://use-cache.com")),
        response,
      );
    },
    async hasItem(key: string) {
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
    async removeItem(key: string) {
      const cache = await openCache;
      await cache.delete(new Request(new URL(key, "https://use-cache.com")));
    },
    async clear() {
      await caches.delete("use-cache");
    },
  };
}
