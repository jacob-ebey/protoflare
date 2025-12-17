import { env } from "cloudflare:workers";

import { AtUri } from "@atproto/syntax";
import { cacheLife, cacheTag, getRequest } from "protoflare/server";
import { href } from "react-router";

import { Main, Shell } from "#components/layout";
import {
  getDidDocument,
  getLastEventTime,
  listStyles,
  StyleStagePreview,
} from "#data";
import { defaultStyle } from "#og-styles";

import { NextPageButton, RefreshButton } from "./styles.client";

export default async function AllStyles() {
  "use cache";
  cacheLife("seconds");
  cacheTag("stylestage");

  const request = getRequest();
  const url = new URL(request.url);

  const cursor = url.searchParams.get("cursor");
  const stylesLimit = 20;
  const [{ cursor: newCursor, results }, lastUpdatedTimestampMilliseconds] =
    await Promise.all([
      listStyles({
        cursor,
        limit: stylesLimit,
      }),
      getLastEventTime(),
    ]);

  const date = new Date(lastUpdatedTimestampMilliseconds / 1000).toUTCString();

  return (
    <>
      <title>Styles Directory | AT Garden Club</title>
      <meta
        name="description"
        content="Browse all CSS stylesheet submissions to AT Garden Club. Explore creative designs from the AT Proto community, each stored on the contributor's own personal data server."
      />
      <link
        rel="stylesheet"
        href={`https://stylestage.dev/styles/css/${defaultStyle.id}.css`}
      />

      <Shell
        title="AT Garden Styles"
        description="Styles fresh from the garden"
      >
        <Main>
          <article>
            <section className="container">
              {results.length ? (
                <ul>
                  {results.map((style) => (
                    <StylePreview key={style.uri} style={style} />
                  ))}
                </ul>
              ) : (
                <p>No styles found</p>
              )}
              <footer>
                <ul>
                  {newCursor && results.length === stylesLimit ? (
                    <>
                      <li>
                        <NextPageButton cursor={newCursor} />
                      </li>
                      {!cursor && (
                        <li>
                          <RefreshButton />{" "}
                        </li>
                      )}
                    </>
                  ) : (
                    <li>
                      <RefreshButton cursor={cursor} />
                    </li>
                  )}
                </ul>
              </footer>
            </section>
            <footer>
              <span>Last Updated {date}</span>
            </footer>
          </article>
        </Main>
      </Shell>
    </>
  );
}

export async function StylePreview({
  style,
}: {
  style: Pick<StyleStagePreview, "authorDid" | "title" | "uri">;
}) {
  "use cache";
  cacheTag(`stylestage/${style.uri}`);

  const { authorDid, title, uri } = style;

  const { rkey } = new AtUri(uri);
  const didDocument = await getDidDocument(authorDid).catch(() => null);

  if (!didDocument) return null;

  return (
    <li>
      <span>
        <a
          href={href("/styles/:userDidOrHandle/:rkey", {
            rkey,
            userDidOrHandle: didDocument.displayName,
          })}
        >
          {title}
          <span aria-hidden="true" />
        </a>
        {" by "}
        <a
          href={href("/styles/:userDidOrHandle", {
            userDidOrHandle: didDocument.displayName,
          })}
        >
          {didDocument.displayName}
        </a>
      </span>
    </li>
  );
}
