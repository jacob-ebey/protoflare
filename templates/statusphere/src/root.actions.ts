"use server";

import {
  destroySession,
  getAtprotoClient,
  getSession,
} from "protoflare/server";
import { href, redirectDocument } from "react-router";

export async function logoutAction() {
  const client = getAtprotoClient();
  const session = getSession();
  const user = session.get("user");

  await Promise.allSettled([user && client.logout(user.did), destroySession()]);

  redirectDocument(href("/"));
}
