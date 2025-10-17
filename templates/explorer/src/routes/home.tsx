import { getSession } from "protoflare/server";

import { LoginForm } from "./home.client";
import { Repo } from "./repo";

export default async function Home() {
  const session = getSession();
  const user = session?.get("user");

  return (
    <>
      <title>{`${user ? user.handle : "Home"} | Explorer`}</title>
      <meta
        name="description"
        content="A simple social app using AT Protocol"
      />

      <main>{!user ? <LoginForm /> : <Repo repo={user.did} />}</main>
    </>
  );
}
