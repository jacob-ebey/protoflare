import { href, type LoaderFunctionArgs } from "react-router";
import { getAtprotoClient } from "~/middleware/atproto";
import { getSession } from "~/middleware/session";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const session = getSession();
    const client = getAtprotoClient();
    if (!session) {
      return Response.redirect(
        new URL(
          `${href("/")}?${new URLSearchParams({
            error: "Session not found",
          }).toString()}`,
          request.url,
        ),
      );
    }

    const url = new URL(request.url);

    const code = url.searchParams.get("code");
    const issuer = url.searchParams.get("iss");
    const state = url.searchParams.get("state");

    if (!code || !issuer || !state) {
      return Response.redirect(
        new URL(
          `${href("/")}?${new URLSearchParams({
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

    return Response.redirect(new URL(href("/"), request.url));
  } catch (error) {
    console.error(error);
    return Response.redirect(
      new URL(
        `${href("/")}?${new URLSearchParams({
          error: "An unknown error occurred",
        }).toString()}`,
        request.url,
      ),
    );
  }
}
