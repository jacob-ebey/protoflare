import { env } from "cloudflare:workers";

import { ClientLayout } from "./root.client";
export { default, ErrorBoundary } from "./root.client";

import "./styles.css";

export async function Layout({ children }: { children: React.ReactNode }) {
  const jetstream = env.JETSTREAM_CONSUMER.getByName("main");

  // Even if you don't use this value in the UI, calling getLastEventTime()
  // ensures that the jetstream consumer DO is started.
  await jetstream
    .getLastEventTime()
    .then((ts) => new Date(ts / 1000).toISOString());

  return <ClientLayout>{children}</ClientLayout>;
}
