"use server";

import { isValidHandle } from "@atproto/syntax";
import { getAtprotoClient } from "protoflare/server";

export async function loginAction(
  _: unknown,
  formData: FormData,
): Promise<{ error: string } | undefined> {
  const handle = formData.get("handle");
  if (!handle) {
    return { error: "Handle is required" };
  }
  if (typeof handle !== "string" || !isValidHandle(handle)) {
    return { error: "Invalid handle" };
  }

  const client = getAtprotoClient();
  let redirectURL: URL;
  try {
    redirectURL = await client.authorize(handle);
  } catch (reason) {
    console.error(reason);
    return { error: "Failed to authorize" };
  }

  throw Response.redirect(redirectURL.href);
}
