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
} from "react-router";
import type {
  DataRouter,
  unstable_RSCPayload as RSCPayload,
} from "react-router";

setServerCallback(
  createCallServer({
    createFromReadableStream,
    createTemporaryReferenceSet,
    encodeReply,
  }),
);

createFromReadableStream<RSCPayload>(getRSCStream()).then((payload) => {
  startTransition(async () => {
    const formState =
      payload.type === "render" ? await payload.formState : undefined;

    hydrateRoot(
      document,
      <StrictMode>
        <RSCHydratedRouter
          payload={payload}
          createFromReadableStream={createFromReadableStream}
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
    const globalVar = window as unknown as {
      __reactRouterDataRouter: DataRouter;
      __reactRouterHdrActive?: boolean;
    };
    try {
      // globalVar.__reactRouterHdrActive = true;
      await globalVar.__reactRouterDataRouter.revalidate();
    } finally {
      // globalVar.__reactRouterHdrActive = false;
    }
  });
}
