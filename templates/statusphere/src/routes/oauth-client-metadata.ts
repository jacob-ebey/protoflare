import { getAtprotoClient } from "protoflare/server";

export function loader() {
  const client = getAtprotoClient();

  return new Response(JSON.stringify(client.clientMetadata, null, 2), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
