import { env } from "cloudflare:workers";

import { cache } from "react";

import { XyzStatusphereStatus } from "~/lexicons";
import { resolveDidDocument, resolveDidFromHandle } from "protoflare/server";

export const getDidDocument = cache(resolveDidDocument);

export const getDidFromDidOrHandle = cache(async (didOrHandle: string) => {
  if (didOrHandle.startsWith("did:")) {
    return didOrHandle;
  }

  return resolveDidFromHandle(didOrHandle).catch(() => undefined);
});

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
