import { getStatusByDid } from "~/data";
import { getSession } from "protoflare/server";

import { LoginForm, StatusForm } from "./home.client";

export default async function Home() {
  const session = getSession();
  const user = session?.get("user");

  const status = user ? await getStatusByDid(user.did) : null;

  return (
    <main>{!user ? <LoginForm /> : <StatusForm status={status?.value} />}</main>
  );
}
