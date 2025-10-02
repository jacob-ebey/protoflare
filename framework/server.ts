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

import {
  deserializeResponse,
  serializeRequestWithoutBody,
  serializeResponse,
} from "./transport-tools";
import { ERROR_BOUNDARY_ERROR, ERROR_DIGEST_BASE } from "./shared";

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

export function callServer(request: Request, routes: RSCRouteConfig) {
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

export async function handleRequest(request: Request, routes: RSCRouteConfig) {
  try {
    const serverResponse = await callServer(request, routes);

    return await prerender(request, serverResponse);
  } catch (error) {
    console.error("Internal Server Error", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
