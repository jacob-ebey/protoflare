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

import { provideAtProtoContext } from "./atproto";
import { provideRequestContext } from "./request";
import { provideSessionContext } from "./session";
import { ERROR_BOUNDARY_ERROR, ERROR_DIGEST_BASE } from "./shared";
import {
  deserializeResponse,
  serializeRequestWithoutBody,
  serializeResponse,
} from "./transport-tools";

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
      serverResponse = await callServer({
        AtpBaseClient,
        authNamespace,
        oauthCallbackPathname,
        oauthClientMeatadataPathname,
        request,
        routes,
        sessionSecrets,
      });
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
    lexicons: Lexicons,
    wantedCollections: WantedIds,
    handleMessage: (
      message: JetStreamMessage<WantedIds[number]>,
    ) => void | Promise<void>,
  ) {
    super(ctx, env);

    this.#lexicons = lexicons;
    this.#wantedCollections = new Set(wantedCollections);
    this.#handleMessage = handleMessage;

    this.#lastEventTime = 1;
    ctx.blockConcurrencyWhile(async () => {
      this.#lastEventTime = (await ctx.storage.get("lastEventTime")) ?? 1;

      const onLoopError = (x: any) => {
        console.error("Loop failed with error: ", x);
      };

      await this.#startLoop().catch(onLoopError);
    });
  }

  getLastEventTime(): number {
    return this.#lastEventTime;
  }

  async alarm() {
    await this.#resetAlarm();
  }

  async #startLoop() {
    this.#resetAlarm();

    await new Promise<void>((resolve, reject) => {
      let url = new URL("wss://jetstream1.us-west.bsky.network/subscribe");
      url.searchParams.set("cursor", String(this.#lastEventTime));
      for (const collection of this.#wantedCollections) {
        url.searchParams.append("wantedCollections", collection);
      }

      console.info("Connecting to ", url.href);
      this.#websocket = new WebSocket(url);
      this.#websocket.addEventListener("open", () => {
        console.info("Connected to Jetstream.");
        resolve();
      });
      this.#websocket.addEventListener("error", (err) => {
        reject(err);
        console.error("Got error from WebSocket: ", err);
        this.#resetAlarm();
      });
      this.#websocket.addEventListener("close", (event) => {
        this.ctx.abort(`Reset due to disconnect: ${event.reason}`);
      });
      this.#websocket.addEventListener("message", async (event) => {
        try {
          const message: JetStreamMessage<WantedIds[number]> = JSON.parse(
            event.data as string,
          );

          if (message.kind === "commit" && message.commit) {
            const uri = `lex:${message.commit.collection}`;
            const lexicon = this.#lexicons.get(uri);
            const valid = lexicon
              ? message.commit.operation === "create"
                ? this.#lexicons.validate(uri, message.commit.record)
                : { success: true }
              : { success: false };

            if (valid.success) {
              this.ctx.waitUntil(
                (async () => this.#handleMessage(message))()
                  .then(async () => {
                    await this.ctx.blockConcurrencyWhile(async () => {
                      if (message.time_us >= this.#lastEventTime) {
                        this.#lastEventTime = message.time_us;
                        await this.ctx.storage.put(
                          "lastEventTime",
                          message.time_us,
                        );
                      }
                    });
                  })
                  .catch(console.error),
              );
            }
          }
        } catch (error) {
          console.error("Failed to handle message", error);
        }
      });
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
