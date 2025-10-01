import type { MiddlewareFunction } from "react-router";

import { atprotoMiddleware } from "./middleware/atproto";
import { getSession, sessionMiddleware } from "./middleware/session";

import { ClientErrorBoundary, ClientLayout, ClientRoot } from "./root.client";
import { getCloudflareContext } from "./middleware/cloudflare";

export { shouldRevalidate } from "./root.client";

export const middleware = [
  sessionMiddleware,
  atprotoMiddleware,
] satisfies MiddlewareFunction[];

export function Layout({ children }: { children: React.ReactNode }) {
  const cf = getCloudflareContext();
  const session = getSession();
  const user = session?.get("user");

  return (
    <ClientLayout location={cf?.colo || "UNKNOWN"} user={user}>
      {children}
    </ClientLayout>
  );
}

export function ErrorBoundary() {
  return <ClientErrorBoundary />;
}

export default function Root() {
  return <ClientRoot />;
}
