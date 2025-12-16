import { getDidFromDidOrHandle, getStyle } from "#data";
import type { Register } from "react-router";

export async function loader({
  params: { rkey, userDidOrHandle },
}: Register["pages"]["/styles/:userDidOrHandle/:rkey/styles.css"]) {
  const userDid = await getDidFromDidOrHandle(userDidOrHandle);
  const style = await getStyle(userDid, rkey);

  if (!style) {
    return new Response("Not Found", { status: 404 });
  }

  return new Response(style.styles, {
    headers: {
      "Content-Type": "text/css; charset=utf-8",
    },
  });
}
