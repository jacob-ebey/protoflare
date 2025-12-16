import { getAtprotoClient } from "protoflare/server";

export function loader() {
  const client = getAtprotoClient();

  return Response.json(client.clientMetadata);
}
