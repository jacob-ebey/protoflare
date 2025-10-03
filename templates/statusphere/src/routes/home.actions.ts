"use server";

import { env, waitUntil } from "cloudflare:workers";

import { isValidHandle } from "@atproto/syntax";
import { getAtprotoClient, getSession } from "protoflare/server";

import { XyzStatusphereStatus } from "~/lexicons";

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
    // Ensure the FirehoseListener DO is started.
    waitUntil(env.FIREHOSE_LISTENER.getByName("main").getLastEventTime());

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

  const record = {
    createdAt: new Date().toISOString(),
    status,
  };
  const isValid = XyzStatusphereStatus.validateRecord({
    $type: "xyz.statusphere.status",
    ...record,
  });

  if (!isValid.success) {
    return { error: "Invalid status" };
  }

  const info = await client.xrpc.xyz.statusphere.status.create(
    { repo: user.did },
    record,
  );

  const create = await env.PDS.getByName(user.did).createRecord(info, record);

  if (!create.success) {
    return { error: "Failed to store status" };
  }
}
