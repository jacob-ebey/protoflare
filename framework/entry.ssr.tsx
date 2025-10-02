import { createFromReadableStream } from "@vitejs/plugin-rsc/ssr";
import { renderToReadableStream } from "react-dom/server";
import {
  unstable_routeRSCServerRequest as routeRSCServerRequest,
  unstable_RSCStaticRouter as RSCStaticRouter,
} from "react-router";

import {
  deserializeRequest,
  deserializeResponse,
  serializeResponse,
  type SerializedRequest,
  type SerializedResponse,
} from "./transport-tools";
import { ERROR_BOUNDARY_ERROR, ERROR_DIGEST_BASE } from "./shared";

export async function prerender(
  _request: Request | SerializedRequest,
  _serverResponse: Response | SerializedResponse,
) {
  const request = deserializeRequest(_request);
  const serverResponse = deserializeResponse(_serverResponse);

  let status: number | undefined;
  let statusText: string | undefined;
  let location: string | undefined;

  const ssrResponse = await routeRSCServerRequest({
    request,
    createFromReadableStream,
    fetchServer: () => Promise.resolve(serverResponse),
    async renderHTML(getPayload) {
      const payload = getPayload();

      const [bootstrapScriptContent, formState] = await Promise.all([
        import.meta.viteRsc.loadBootstrapScriptContent("index"),
        payload.formState,
      ]);

      return renderToReadableStream(
        <RSCStaticRouter getPayload={getPayload} />,
        {
          bootstrapScriptContent,
          formState,
          signal: request.signal,
          onError(error) {
            if (
              typeof error === "object" &&
              error &&
              "digest" in error &&
              typeof error.digest === "string" &&
              error.digest.startsWith(`${ERROR_DIGEST_BASE}[`) &&
              error.digest.endsWith("]")
            ) {
              return error.digest;
            }
          },
        },
      );
    },
  });

  let response = ssrResponse;

  if (typeof status === "number") {
    response = new Response(ssrResponse.body, {
      cf: ssrResponse.cf,
      headers: ssrResponse.headers,
      status,
      statusText,
      webSocket: ssrResponse.webSocket,
    });
  }

  return serializeResponse(response);
}
