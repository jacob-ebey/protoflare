"use server";

import { href, redirectDocument } from "react-router";
import { destroySession } from "protoflare/server";

export async function logoutAction() {
  await destroySession();
  redirectDocument(href("/"));
}
