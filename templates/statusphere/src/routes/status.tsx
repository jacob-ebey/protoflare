import type { Register } from "react-router";

import { getDidDocument, getDidFromDidOrHandle, getStatusByDid } from "~/data";

export default async function Status({
  params: { didOrHandle },
}: Register["pages"]["/status/:didOrHandle"]) {
  const did = await getDidFromDidOrHandle(didOrHandle).catch(() => undefined);
  const didDoc = did ? await getDidDocument(did) : undefined;

  if (!didDoc) {
    throw new Response("", {
      status: 404,
      statusText: "Could not find DID or handle",
    });
  }

  const status = await getStatusByDid(didDoc.id);
  const aka = didDoc.alsoKnownAs?.[0]?.replace(/^at:\/\//, "") || didDoc.id;

  return (
    <>
      <title>{`${aka} | Statusphere`}</title>
      <meta name="description" content={`Status page for ${aka}`} />

      <main>
        <article>
          <h1>
            {status?.status || "no status"}
            {" - "}
            {aka}
          </h1>
        </article>
      </main>
    </>
  );
}
