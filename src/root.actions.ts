"use server";

import { href, redirectDocument } from "react-router";
import { destroySession } from "./middleware/session";

export async function logoutAction() {
  await destroySession();
  redirectDocument(href("/"));
}
