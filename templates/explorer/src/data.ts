import { cache } from "react";
import {
  getAtprotoClient,
  resolveDidDocument,
  resolveDidFromHandle,
} from "protoflare/server";

const getDidFromHandle = cache<typeof resolveDidFromHandle>((...args) => {
  "use cache";
  return resolveDidFromHandle(...args);
});

export const getDidDocument = cache<typeof resolveDidDocument>((...args) => {
  "use cache";
  return resolveDidDocument(...args);
});

export const getDidFromDidOrHandle = cache(async (didOrHandle: string) => {
  if (didOrHandle.startsWith("did:")) {
    return didOrHandle;
  }

  return getDidFromHandle(didOrHandle);
});

export const getRepoDescription = cache(async (repo: string) => {
  const client = getAtprotoClient();
  const repos = await client.xrpc.com.atproto.repo.describeRepo({ repo });
  return repos.data;
});

export const listRecords = cache(async (repo: string, collection: string) => {
  const client = getAtprotoClient();
  const records = await client.xrpc.com.atproto.repo.listRecords({
    repo,
    collection,
  });
  return records.data.records;
});
