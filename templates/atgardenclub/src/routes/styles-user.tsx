import { type Register } from "react-router";

import { Main, Shell } from "#components/layout";
import { getDidDocument, getDidFromDidOrHandle, listUserStyles } from "#data";
import { defaultStyle } from "#og-styles";

import { StylePreview } from "./styles";

export default async function AllStyles({
  params: { userDidOrHandle },
}: Register["pages"]["/styles/:userDidOrHandle"]) {
  const userDid = await getDidFromDidOrHandle(userDidOrHandle);
  const [results, didDocument] = await Promise.all([
    listUserStyles(userDid),
    getDidDocument(userDid),
  ]);

  return (
    <>
      <title>{`${didDocument.displayName} | AT Garden Club`}</title>
      <meta
        name="description"
        content="Browse all CSS stylesheet submissions to AT Garden Club. Explore creative designs from the AT Proto community, each stored on the contributor's own personal data server."
      />
      <link
        rel="stylesheet"
        href={`https://stylestage.dev/styles/css/${defaultStyle.id}.css`}
      />

      <Shell
        title={didDocument.displayName}
        description={`Styles fresh from the ${didDocument.displayName} garden`}
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
            </section>
          </article>
        </Main>
      </Shell>
    </>
  );
}
