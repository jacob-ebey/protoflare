import { getAtprotoClient } from "~/middleware/atproto";

export function loader() {
  const client = getAtprotoClient();

  return new Response(JSON.stringify(client.clientMetadata, null, 2), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
