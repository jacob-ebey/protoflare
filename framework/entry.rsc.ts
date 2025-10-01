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
      return new Response(
        renderToReadableStream(match.payload, {
          temporaryReferences,
        }),
        {
          status: match.statusCode,
          headers: match.headers,
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
    console.error(error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
