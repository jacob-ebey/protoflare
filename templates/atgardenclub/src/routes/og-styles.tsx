import { href, Link, type Register } from "react-router";

import { Main, Shell } from "#components/layout";
import { defaultStyle, ogStyles } from "#og-styles";

export default async function OgStyles({}: Register["pages"]["/og-styles"]) {
  return (
    <>
      <title>OG Styles Directory | AT Garden Club</title>
      <meta
        name="description"
        content="Browse the original Style Stage CSS designs that inspired AT Garden Club. Explore creative stylesheets from the Style Stage community."
      />
      <link
        rel="stylesheet"
        href={`https://stylestage.dev/styles/css/${defaultStyle.id}.css`}
      />

      <Shell
        title="OG Style Stage"
        description="The original Style Stage styles to inspire you on your journey"
      >
        <Main>
          <article>
            <section className="container">
              <ul>
                {ogStyles.map((style) => (
                  <li key={style.id}>
                    <span>
                      <a
                        href={href("/og-styles/:id", {
                          id: style.id,
                        })}
                      >
                        {style.name}
                        <span aria-hidden="true" />
                      </a>
                      {" by "}
                      <span>{style.by}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </article>
        </Main>
      </Shell>
    </>
  );
}
