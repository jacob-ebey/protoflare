import { env } from "cloudflare:workers";

import { getRequest, getSession } from "protoflare/server";

import { ClientLayout } from "./root.client";
export { default, ErrorBoundary } from "./root.client";

export async function Layout({ children }: { children: React.ReactNode }) {
  const { cf } = getRequest();
  const session = getSession();
  const user = session?.get("user");
  const jetstream = env.JETSTREAM_CONSUMER.getByName("main");

  // Even if you don't use this value in the UI, calling getLastEventTime()
  // ensures that the jetstream consumer DO is started.
  const lastSyncedAt = await jetstream
    .getLastEventTime()
    .then((ts) => new Date(ts / 1000).toISOString());

  return (
    <ClientLayout
      lastSyncedAt={lastSyncedAt}
      location={(typeof cf?.colo === "string" && cf.colo) || "UNKNOWN"}
      user={user}
    >
      {children}
    </ClientLayout>
  );
}
