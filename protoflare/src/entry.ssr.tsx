import { createFromReadableStream } from "@vitejs/plugin-rsc/ssr";
import { renderToReadableStream } from "react-dom/server";
import {
  unstable_routeRSCServerRequest as routeRSCServerRequest,
  unstable_RSCStaticRouter as RSCStaticRouter,
} from "react-router";

export async function prerender(
  request: Request,
  serverResponse: Response,
  hydrate: boolean,
) {
  return await routeRSCServerRequest({
    request,
    hydrate,
    createFromReadableStream,
    serverResponse,
    async renderHTML(getPayload, options) {
      const payload = getPayload();

      const [bootstrapScriptContent, formState] = await Promise.all([
        hydrate
          ? import.meta.viteRsc.loadBootstrapScriptContent("index")
          : undefined,
        payload.formState,
      ]);

      return renderToReadableStream(
        <RSCStaticRouter getPayload={getPayload} />,
        {
          ...options,
          bootstrapScriptContent,
          formState,
          signal: request.signal,
        },
      );
    },
  });
}
