import { env } from "cloudflare:workers";

import { cache } from "react";
import { resolveDidDocument, resolveDidFromHandle } from "protoflare/server";

export const getDidDocument = cache(resolveDidDocument);

export const getDidFromDidOrHandle = cache(async (didOrHandle: string) => {
  if (didOrHandle.startsWith("did:")) {
    return didOrHandle;
  }

  return resolveDidFromHandle(didOrHandle).catch(() => undefined);
});

export const getStatusByDid = cache(async (did: string) => {
  return await env.DB.prepare(
    /* SQL */ `
      SELECT uri, status, createdAt, indexedAt
      FROM status
      WHERE authorDid = ?
      ORDER BY createdAt DESC
      LIMIT 1;
    `,
  )
    .bind(did)
    .first<{
      uri: string;
      status: string;
      createdAt: string;
      indexedAt: string;
    }>();
});

export const getLatesetStatuses = cache(async () => {
  const result = await env.DB.prepare(
    /* SQL */ `
      SELECT uri, status, authorDid, createdAt, indexedAt
      FROM status
      ORDER BY createdAt DESC
      LIMIT 20;
    `,
  ).all<{
    uri: string;
    status: string;
    authorDid: string;
    createdAt: string;
    indexedAt: string;
  }>();

  return result.results;
});
