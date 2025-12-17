import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import {
  createFromReadableStream,
  createTemporaryReferenceSet,
  encodeReply,
  setServerCallback,
} from "@vitejs/plugin-rsc/browser";
import {
  unstable_createCallServer as createCallServer,
  unstable_getRSCStream as getRSCStream,
  unstable_RSCHydratedRouter as RSCHydratedRouter,
} from "react-router/dom";
import type {
  DataRouter,
  unstable_RSCPayload as RSCPayload,
} from "react-router";

async function clearCache(cache: Cache): Promise<void> {
  const keys = await cache.keys();
  await Promise.all(keys.map((key) => cache.delete(key)));
}

async function openAndClearCache(cacheName: string): Promise<Cache> {
  const cache = await caches.open(cacheName);
  await clearCache(cache);
  return cache;
}

let clearCachePromise: Promise<void> | null = null;
const openDataCachePromise = openAndClearCache("react-router");
function clearDataCache() {
  return (clearCachePromise = Promise.resolve(openDataCachePromise).then(() =>
    openDataCachePromise.then((cache) => clearCache(cache)),
  ));
}

async function fetchServer(request: Request): Promise<Response> {
  if (request.method !== "GET") {
    const [response] = await Promise.all([fetch(request), clearDataCache()]);
    return response;
  }

  await clearCachePromise;

  const cache = await openDataCachePromise;
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  const response = await fetch(request);
  await cache.put(request, response.clone());

  return response;
}

setServerCallback(
  createCallServer({
    createFromReadableStream,
    createTemporaryReferenceSet,
    encodeReply,
    fetch: fetchServer,
  }),
);

const documentResponseStatus = (
  window.performance.getEntriesByType("navigation")?.[0] as {
    responseStatus?: number;
  }
)?.responseStatus;

let rscStream = getRSCStream();

if (documentResponseStatus === 200) {
  let [stream, cacheStream] = rscStream.tee();
  rscStream = stream;
  openDataCachePromise.then((cache) => {
    const url = new URL(window.location.href);
    if (url.pathname === "/") {
      url.pathname = "/_root.rsc";
    } else {
      url.pathname = `${url.pathname}.rsc`;
    }
    cache.put(
      url,
      new Response(cacheStream, { status: documentResponseStatus }),
    );
  });
}

createFromReadableStream<RSCPayload>(rscStream).then((payload) => {
  startTransition(async () => {
    const formState =
      payload.type === "render" ? await payload.formState : undefined;

    const globalVar = window as unknown as {
      __routeDiscovery?: "lazy" | "eager";
    };

    hydrateRoot(
      document,
      <StrictMode>
        <RSCHydratedRouter
          payload={payload}
          createFromReadableStream={createFromReadableStream}
          fetch={fetchServer}
          routeDiscovery={globalVar.__routeDiscovery}
        />
      </StrictMode>,
      {
        // @ts-expect-error - no types for this yet
        formState,
      },
    );
  });
});

if (import.meta.hot) {
  import.meta.hot.on("rsc:update", async () => {
    clearDataCache();
    const globalVar = window as unknown as {
      __reactRouterDataRouter: DataRouter;
    };
    globalVar.__reactRouterDataRouter.revalidate();
  });
}
