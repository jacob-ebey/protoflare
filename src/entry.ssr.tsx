import { createFromReadableStream } from "@vitejs/plugin-rsc/ssr";
import { renderToReadableStream } from "react-dom/server.edge";
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

export async function prerender(
  _request: Request | SerializedRequest,
  _serverResponse: Response | SerializedResponse
) {
  const request = deserializeRequest(_request);
  const serverResponse = deserializeResponse(_serverResponse);

  const response = await routeRSCServerRequest({
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
        }
      );
    },
  });

  return serializeResponse(response);
}
