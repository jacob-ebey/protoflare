import { env } from "cloudflare:workers";

import { cache } from "react";

import { XyzStatusphereStatus } from "./lexicons";

export const getStatusByDid = cache(async (did: string) => {
  const local = await env.PDS.getByName(did).listRecords({
    repo: did,
    collection: "xyz.statusphere.status",
    limit: 1,
  });
  const record = local.records[0];
  const isValid = XyzStatusphereStatus.validateRecord(record?.value);
  if (isValid.success) {
    return {
      ...record,
      value: isValid.value,
    };
  }
});
