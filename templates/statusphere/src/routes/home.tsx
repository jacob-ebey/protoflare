import { getSession } from "protoflare/server";

import { getDidDocument, getLatesetStatuses, getStatusByDid } from "~/data";

import { LoginForm, StatusForm } from "./home.client";
import { cacheLife } from "vite-plugin-react-use-cache/runtime";

export default async function Home() {
  const session = getSession();
  const user = session?.get("user");

  const status = user ? await getStatusByDid(user.did) : null;

  return (
    <>
      <title>Home | Statusphere</title>
      <meta
        name="description"
        content="A simple social app using AT Protocol"
      />

      <main>
        {!user ? <LoginForm /> : <StatusForm status={status} />}

        <LatestStatuses />
      </main>
    </>
  );
}

async function LatestStatuses() {
  "use cache";
  cacheLife("seconds");

  const latestStatuses = await getLatesetStatuses();

  return (
    <section>
      <h2>Latest Statuses</h2>
      <ul>
        {latestStatuses.map((status) => (
          <LatestStatus key={status.uri} status={status} />
        ))}
      </ul>
    </section>
  );
}

async function LatestStatus({
  status,
}: {
  status: {
    uri: string;
    status: string;
    authorDid: string;
    createdAt: string;
  };
}) {
  const didDoc = await getDidDocument(status.authorDid).catch(() => null);

  const displayName =
    didDoc?.alsoKnownAs?.[0]?.replace("at://", "") || status.authorDid;

  return (
    <li key={status.uri}>
      <span>{status.status}</span>
      <small>
        {" "}
        {displayName} {status.createdAt}
      </small>
    </li>
  );
}
