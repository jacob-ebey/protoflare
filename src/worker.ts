import { handleRequest } from "framework/server";

import { provideCloudflareContext } from "~/middleware/cloudflare";
import { routes } from "~/routes";

export { FirehoseListener } from "./storage/firehose";
export { PDS, RepoStorage } from "./storage/pds";

export default {
  async fetch(request, env, ctx) {
    if (import.meta.env.DEV) {
      // Ensure the FirehoseListener DO is started.
      ctx.waitUntil(env.FIREHOSE_LISTENER.getByName("main").getLastEventTime());
    }
    return provideCloudflareContext(request.cf, () =>
      handleRequest(request, routes),
    );
  },
} satisfies ExportedHandler<Env>;
