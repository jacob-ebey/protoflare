import { handleRequest } from "framework/server";

import { provideCloudflareContext } from "~/middleware/cloudflare";
import { routes } from "~/routes";

export { FirehoseListener } from "./storage/firehose";
export { PDS, RepoStorage } from "./storage/pds";

export default {
  async fetch(request) {
    return provideCloudflareContext(request.cf, () =>
      handleRequest(request, routes),
    );
  },
} satisfies ExportedHandler<Env>;
