import {
  createTemporaryReferenceSet,
  decodeAction,
  decodeFormState,
  decodeReply,
  loadServerAction,
  renderToReadableStream,
} from "@vitejs/plugin-rsc/rsc";
import { unstable_matchRSCServerRequest as matchRSCServerRequest } from "react-router";

import { routes } from "./routes";
import {
  deserializeResponse,
  serializeRequestWithoutBody,
  serializeResponse,
} from "./transport-tools";

function callServer(request: Request) {
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

export default {
  async fetch(request) {
    const ssr = await import.meta.viteRsc.loadModule<
      typeof import("./entry.ssr")
    >("ssr", "index");

    const serverResponse = await callServer(request);

    const ssrResponse = await ssr.prerender(
      serializeRequestWithoutBody(request),
      serializeResponse(serverResponse),
    );

    return deserializeResponse(ssrResponse);
  },
} satisfies ExportedHandler;
