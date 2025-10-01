"use server";

import { href, redirect } from "react-router";
import { destroySession } from "./middleware/session";

export async function logoutAction() {
  await destroySession();
  redirect(href("/"));
}
