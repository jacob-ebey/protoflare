import { AtUri } from "@atproto/syntax";
import { Register } from "react-router";
import { getStatusByDid } from "~/data";
import {
  resolveDidDocument,
  resolveDidFromHandle,
} from "~/lib/atproto-oauth-client";

export default async function Status({
  params: { didOrHandle },
}: Register["pages"]["/status/:didOrHandle"]) {
  let did: string | undefined;
  try {
    if (didOrHandle.startsWith("did:")) {
      did = didOrHandle;
    } else {
      did = await resolveDidFromHandle(didOrHandle).catch(() => undefined);
    }
  } catch {}

  const didDoc = did ? await resolveDidDocument(did) : undefined;

  if (!didDoc) {
    return (
      <main>
        <article>
          <h1>Invalid DID or handle: {didOrHandle}</h1>
        </article>
      </main>
    );
  }

  const status = await getStatusByDid(didDoc.id);

  return (
    <main>
      <article>
        <h1>
          Status{" "}
          {didDoc.alsoKnownAs?.[0]?.replace(/^at:\/\//, "@") || didOrHandle}{" "}
          {status?.value.status}
        </h1>
      </article>
    </main>
  );
}
