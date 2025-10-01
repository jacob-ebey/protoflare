import { Register } from "react-router";
import { getDidDocument, getDidFromDidOrHandle, getStatusByDid } from "~/data";

export default async function Status({
  params: { didOrHandle },
}: Register["pages"]["/status/:didOrHandle"]) {
  const did = await getDidFromDidOrHandle(didOrHandle);
  const didDoc = did ? await getDidDocument(did) : undefined;

  if (!didDoc) {
    throw new Error("DID Document not found");
  }

  const status = await getStatusByDid(didDoc.id);

  return (
    <main>
      <article>
        <h1>
          {didDoc.alsoKnownAs?.[0]?.replace(/^at:\/\//, "@") || didDoc.id}
          {" - "}
          {status?.value.status || "no status"}
        </h1>
      </article>
    </main>
  );
}
