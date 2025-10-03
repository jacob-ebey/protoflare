import { env } from "cloudflare:workers";

import { getRequest, getSession } from "protoflare/server";

import { ClientLayout } from "./root.client";
export { default, ErrorBoundary } from "./root.client";

export async function Layout({ children }: { children: React.ReactNode }) {
  const { cf } = getRequest();
  const session = getSession();
  const user = session?.get("user");
  const firehose = env.FIREHOSE_LISTENER.getByName("main");

  const lastSyncedAt = await firehose
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
