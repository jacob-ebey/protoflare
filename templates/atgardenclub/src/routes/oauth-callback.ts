import { href, type LoaderFunctionArgs } from "react-router";
import { getAtprotoClient, getSession } from "protoflare/server";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const session = getSession();
    const client = getAtprotoClient();

    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const issuer = url.searchParams.get("iss");
    const state = url.searchParams.get("state");

    if (!code || !issuer || !state) {
      return Response.redirect(
        new URL(
          `${href("/contribute")}?${new URLSearchParams({
            error: "Failed to exchange code",
          }).toString()}`,
          request.url,
        ),
      );
    }

    const { did, handle } = await client.exchange({
      code,
      issuer,
      state,
    });

    session.set("user", { did, handle });

    return Response.redirect(new URL(href("/contribute"), request.url));
  } catch (error) {
    console.error(error);
    return Response.redirect(
      new URL(
        `${href("/contribute")}?${new URLSearchParams({
          error: "An unknown error occurred",
        }).toString()}`,
        request.url,
      ),
    );
  }
}
