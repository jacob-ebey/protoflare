import { createFromReadableStream } from "@vitejs/plugin-rsc/ssr";
import { isbot } from "isbot";
import { renderToReadableStream } from "react-dom/server";
import {
  unstable_routeRSCServerRequest as routeRSCServerRequest,
  unstable_RSCStaticRouter as RSCStaticRouter,
} from "react-router";

import { injectBeforeFirst } from "./stream";

export async function prerender(
  request: Request,
  serverResponse: Response,
  hydrate: boolean,
  routeDiscovery: "lazy" | "eager" | undefined,
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

      const reactHTML = await renderToReadableStream(
        <RSCStaticRouter getPayload={getPayload} />,
        {
          ...options,
          bootstrapScriptContent,
          formState,
          signal: request.signal,
        },
      );

      if (isbot(request.headers.get("User-Agent"))) {
        await reactHTML.allReady;
      }

      let html: ReadableStream<Uint8Array> = reactHTML;
      if (routeDiscovery) {
        html = reactHTML.pipeThrough(
          injectBeforeFirst(
            "<script ",
            `<script>window.__routeDiscovery=${JSON.stringify(routeDiscovery)};</script>`,
          ),
        );
      }

      return html;
    },
  });
}
