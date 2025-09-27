import { env } from "cloudflare:workers";

import { TID } from "@atproto/common-web";
import { isValidHandle } from "@atproto/syntax";
import htmlEscape from "html-es6cape";

import { AtprotoOAuthClient } from "./atproto-oauth-client";
import { AtpBaseClient } from "./lexicons";
import * as StatusphereStatus from "./lexicons/types/xyz/statusphere/status";
import {
  destroySession,
  getSession,
  sessionMiddleware,
} from "./middleware/session";
export { bindOauthClient } from "./storage/atproto-record";
import { SimplifyRecord } from "./storage/utils";
import { bindOauthClient } from "./storage/atproto-record";

export { AtprotoRecordStorage } from "./storage/atproto-record";

const html = String.raw;

const oauthCallbackPathname = "/oauth/callback";
const oauthClientMeatadataPathname = "/oauth/client-metadata.json";

const validStatusList = [
  "🤔",
  "🤨",
  "🙄",
  "😐",
  "😑",
  "😶",
  "😏",
  "😌",
  "😍",
  "🤩",
  "🤗",
  "🤑",
  "🤓",
  "🤔",
  "🤨",
  "🙄",
  "😐",
  "😑",
  "😶",
  "😏",
  "😌",
  "😍",
  "🤩",
  "🤗",
  "🤑",
  "🤓",
  "🤔",
  "🤨",
  "🙄",
  "😐",
  "😑",
  "😶",
  "😏",
  "😌",
  "😍",
  "🤩",
  "🤗",
  "🤑",
  "🤓",
  "🤔",
  "🤨",
  "🙄",
  "😐",
  "😑",
  "😶",
  "😏",
  "😌",
  "😍",
  "🤩",
  "🤗",
  "🤑",
  "🤓",
];
const validStatusSet = new Set(validStatusList);

export default {
  fetch(request: Request) {
    let oauthClient = new AtprotoOAuthClient({
      AtpBaseClient,
      callbackPathname: oauthCallbackPathname,
      clientMetadataPathname: oauthClientMeatadataPathname,
      clientMetadata: {
        client_name: "AtprotoTest",
        client_uri: new URL("/", request.url).href,
        scope: "atproto transition:generic",
      },
      namespace: env.OAUTH_STORAGE,
      request,
    });

    const client = bindOauthClient(env.ATPROTO_RECORDS, oauthClient);

    return sessionMiddleware(
      { context: new Map(), params: {}, request },
      async () => {
        try {
          const session = getSession();
          const user = session.get("user");
          if (user) {
            try {
              await oauthClient.restore(user.did, {
                signal: request.signal,
              });
            } catch (reason) {
              console.error(reason);
              destroySession();
              return Response.redirect(
                new URL(
                  `/login?${new URLSearchParams({
                    error: "Failed to restore user",
                  }).toString()}`,
                  request.url
                )
              );
            }
          }

          const url = new URL(request.url);

          const pathname =
            url.pathname === "/"
              ? "/"
              : url.pathname.endsWith("/")
                ? url.pathname.slice(0, -1)
                : url.pathname;

          switch (pathname) {
            case "/": {
              let status: StatusphereStatus.Record | undefined;
              if (user) {
                action: if (request.method === "POST") {
                  const formData = await request.formData();
                  const status = formData.get("status");

                  if (
                    !status ||
                    typeof status !== "string" ||
                    !validStatusSet.has(status)
                  ) {
                    break action;
                  }

                  const statusRecord: SimplifyRecord<StatusphereStatus.Record> =
                    {
                      createdAt: new Date().toISOString(),
                      status,
                    };

                  const rkey = TID.nextStr();
                  await client.xyz.statusphere.status.create(
                    { repo: user.did, rkey },
                    statusRecord
                  );
                }

                const statusResult = await client.xyz.statusphere.status.list({
                  repo: user.did,
                  limit: 1,
                });
                status = statusResult.records[0]?.value;
              }

              return new Response(
                Document(
                  { title: "Home" },
                  html`
                    <section>
                      <h1>Hello, ${htmlEscape(user?.handle || "World")}!</h1>
                      ${status ? html`<p>Status: ${status.status}</p>` : ""}
                      ${user
                        ? html`
                            <form
                              method="post"
                              style="display: grid; grid-template-columns: 1fr auto;"
                            >
                              <div>
                                <label for="input-status" class="sr-only"
                                  >Status</label
                                >
                                <select id="input-status" name="status">
                                  ${validStatusList.map(
                                    (status) => html`
                                      <option value="${status}">
                                        ${status}
                                      </option>
                                    `
                                  )}
                                </select>
                              </div>
                              <button type="submit">Set Status</button>
                            </form>
                          `
                        : ""}
                    </section>
                  `
                ),
                {
                  headers: {
                    "Content-Type": "text/html; charset=utf-8",
                  },
                }
              );
            }
            case "/logout": {
              await destroySession();
              return Response.redirect(new URL("/", request.url));
            }
            case "/login": {
              let error: string | null = url.searchParams.get("error");

              action: if (request.method === "POST") {
                const formData = await request.formData();
                const handle = formData.get("handle");
                if (!handle) {
                  error = "Handle is required";
                  break action;
                }
                if (typeof handle !== "string" || !isValidHandle(handle)) {
                  error = "Invalid handle";
                  break action;
                }

                try {
                  const redirectURL = await oauthClient.authorize(handle, {
                    signal: request.signal,
                  });

                  return Response.redirect(redirectURL);
                } catch (reason) {
                  error = "Failed to authorize";
                  console.error(reason);
                  break action;
                }
              }

              return new Response(
                Document(
                  { title: "Login" },
                  html`
                    <section>
                      <h1>Login</h1>
                      <form method="post" action="/login">
                        <div>
                          <label for="input-handle">Handle</label>
                          <input
                            type="text"
                            name="handle"
                            id="input-handle"
                            ${error
                              ? `aria-describedby="input-handle-error"`
                              : ""}
                          />
                          ${error
                            ? `<div id="input-handle-error">${htmlEscape(error)}</div>`
                            : ""}
                        </div>
                        <div>
                          <button type="submit">Login</button>
                        </div>
                      </form>
                    </section>
                  `
                ),
                {
                  headers: {
                    "Content-Type": "text/html; charset=utf-8",
                  },
                }
              );
            }
            case oauthClientMeatadataPathname: {
              return new Response(
                JSON.stringify(oauthClient.clientMetadata, null, 2),
                {
                  headers: {
                    "Content-Type": "application/json; charset=utf-8",
                  },
                }
              );
            }
            case oauthCallbackPathname: {
              const url = new URL(request.url);
              const code = url.searchParams.get("code");
              const issuer = url.searchParams.get("iss");
              const state = url.searchParams.get("state");

              if (!code || !issuer || !state) {
                return Response.redirect(
                  new URL(
                    `/login?${new URLSearchParams({
                      error: "Failed to exchange code",
                    }).toString()}`,
                    request.url
                  )
                );
              }

              const { did, handle } = await oauthClient.exchange({
                code,
                issuer,
                state,
              });

              const session = getSession();
              session.set("user", { did, handle });

              return Response.redirect(new URL("/", request.url));
            }
          }

          const profileMatch = new URLPattern({
            pathname: "/profile/:handleOrDid",
          }).exec(request.url);
          if (profileMatch) {
            const { handleOrDid } = profileMatch.pathname.groups;
            const profileResult = await client.app.bsky.actor
              .getProfile(
                {
                  actor: handleOrDid,
                },
                { signal: request.signal }
              )
              .catch(() => ({ success: false }) as const);
            if (profileResult.success) {
              const {
                did,
                handle,
                displayName,
                avatar,
                postsCount,
                followersCount,
                followsCount,
              } = profileResult.data;

              const statusResult = await client.xyz.statusphere.status.list({
                repo: did,
                limit: 1,
              });
              const status = statusResult.records[0]?.value;

              return new Response(
                Document(
                  {
                    title: `${handle} - ${displayName}`,
                    head: html`
                      <link rel="stylesheet" href="/styles.profile.css" />
                    `,
                  },
                  html`
                    <section class="profile">
                      <picture>
                        ${avatar
                          ? html`<img
                              src=${htmlEscape(avatar)}
                              alt=""
                              height="200"
                            />`
                          : ""}
                      </picture>
                      <div>
                        <h1>
                          ${htmlEscape(displayName || handle)}
                          ${status ? htmlEscape(" " + status.status) : ""}
                        </h1>
                        ${displayName
                          ? html` <p>@${htmlEscape(handle)}</p> `
                          : ""}
                        <ul>
                          ${followersCount
                            ? html`
                                <li>
                                  ${htmlEscape(String(followersCount))}
                                  followers
                                </li>
                              `
                            : ""}
                          ${followsCount
                            ? html`
                                <li>
                                  ${htmlEscape(String(followsCount))} following
                                </li>
                              `
                            : ""}
                          ${postsCount
                            ? html`
                                <li>${htmlEscape(String(postsCount))} posts</li>
                              `
                            : ""}
                        </ul>
                      </div>
                    </section>
                  `
                ),
                {
                  headers: {
                    "Content-Type": "text/html; charset=utf-8",
                  },
                }
              );
            }
          }

          return new Response(`Not found: ${pathname}`, { status: 404 });
        } catch (reason) {
          console.error({ reason, cause: (reason as Error)?.cause });
          return new Response("Internal server error", { status: 500 });
        }
      }
    );
  },
};

function Document(
  { head, title }: { head?: string; title: string },
  children: string
) {
  const session = getSession();
  const user = session.get("user");

  return html`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="/styles.css" />
        <title>${htmlEscape(title)}</title>
        ${head || ""}
      </head>
      <body>
        <header>
          <nav>
            <h1><a href="/">App Name</a></h1>
            <ul>
              ${user
                ? html`
                    <li>
                      <form method="post" action="/logout">
                        <div>
                          <button type="submit">Logout</button>
                        </div>
                      </form>
                    </li>
                  `
                : html`
                    <li>
                      <a href="/login">Login </a>
                    </li>
                  `}
            </ul>
          </nav>
        </header>
        <main>${children}</main>
      </body>
    </html>
  `;
}
