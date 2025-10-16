"use server";

import { env } from "cloudflare:workers";

import { TID } from "@atproto/common-web";
import { isValidHandle } from "@atproto/syntax";
import { getAtprotoClient, getSession } from "protoflare/server";

import * as Status from "~/lexicons/types/xyz/statusphere/status";

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

export async function setStatusAction(
  _: unknown,
  formData: FormData,
): Promise<{ error: string } | undefined> {
  const session = getSession();
  const user = session?.get("user");
  if (!user) {
    throw new Error("Not logged in");
  }

  const client = getAtprotoClient();

  const status = formData.get("status");
  if (!status || typeof status !== "string" || status.length > 2) {
    return { error: "Invalid status" };
  }

  const createdAt = new Date().toISOString();

  const valid = Status.validateRecord({
    $type: "xyz.statusphere.status",
    createdAt,
    status,
  });

  if (!valid.success) {
    return { error: "Invalid status" };
  }

  const rkey = TID.nextStr();
  const uri = await client.xrpc.xyz.statusphere.status
    .create({ repo: user.did, rkey, validate: false }, valid.value)
    .then((res) => res.uri)
    .catch((error) => {
      console.error("Failed to broadcast status", error);
      return false;
    });

  if (!uri) {
    return { error: "Failed to broadcast status" };
  }

  const res = await env.DB.prepare(
    /* SQL */ `
    INSERT INTO status (
      uri, authorDid, status, createdAt, indexedAt
    ) VALUES (?, ?, ?, ?, ?);
  `,
  )
    .bind(
      uri,
      user.did,
      valid.value.status,
      valid.value.createdAt,
      valid.value.createdAt,
    )
    .run();

  if (!res.meta.rows_written) {
    return { error: "Failed to save status" };
  }
}
