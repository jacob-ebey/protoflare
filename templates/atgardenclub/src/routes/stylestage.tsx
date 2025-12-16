import { href, type Register } from "react-router";

import { Main, Shell } from "#components/layout";
import {
  CurrentlyStagedStyle,
  CurrentlyStagedStyleSocialLink,
  CurrentlyStagedStyleWebsiteLink,
  FeaturedStyles,
} from "#components/sections";
import { defaultStyle } from "#og-styles";
import {
  getDidDocument,
  getDidFromDidOrHandle,
  getStyle,
  StyleStage,
} from "#data";
import { didDocument } from "@atproto/common-web";
import { AtUri } from "@atproto/syntax";

export default async function Home({
  params,
}:
  | Register["pages"]["/"]
  | Register["pages"]["/styles/:userDidOrHandle/:rkey"]) {
  let style: StyleStage | undefined;
  let didDocument: Awaited<ReturnType<typeof getDidDocument>> | undefined;
  if (
    "userDidOrHandle" in params &&
    "rkey" in params &&
    params.userDidOrHandle &&
    params.rkey
  ) {
    const userDid = await getDidFromDidOrHandle(params.userDidOrHandle);
    const results = await Promise.all([
      getStyle(userDid, params.rkey),
      getDidDocument(userDid),
    ]);
    style = results[0];
    didDocument = results[1];
    if (!style || !didDocument) throw new Response("", { status: 404 });
  }

  return (
    <>
      <title>{`${style ? style.title || "Unknown" : "Home"} | AT Garden Club`}</title>
      <meta
        name="description"
        content={
          style
            ? `View ${style.title || "Unknown"} - a CSS design submission to AT Garden Club, the decentralized CSS showcase powered by the AT Protocol.`
            : "AT Garden Club - A decentralized CSS showcase where contributors own their data. Inspired by CSS Zen Garden, powered by the AT Protocol. Submit your stylesheet today!"
        }
      />
      {style ? (
        <style dangerouslySetInnerHTML={{ __html: style.styles }} />
      ) : (
        <link
          rel="stylesheet"
          href={`https://stylestage.dev/styles/css/${defaultStyle.id}.css`}
        />
      )}

      <Shell
        title="AT Garden Club"
        description="A CSS showcase styled by the AT Proto community"
      >
        <Main>
          <article id="about">
            <section className="container">
              <h2>Setting the Stage</h2>
              <p>
                In 2003,{" "}
                <a href="http://daveshea.com/projects/zen/">Dave Shea</a> began
                a legendary project called{" "}
                <a href="http://www.csszengarden.com/">CSS Zen Garden</a> that
                provided a demonstration of "what can be accomplished through
                CSS-based design" until submissions stopped in 2013.{" "}
                <a href="">Stephanie Eckles</a> rekindled that spirit with{" "}
                <a href="https://stylestage.dev/">Style Stage</a> by providing
                this page (minus a few prose changes) as the base HTML for
                contributors - like you! - to re-style by submitting an
                alternate stylesheet.
              </p>
              <p>
                <strong>AT Garden Club</strong> seeks to decenteralize
                submissions through the ATProtocol allowing submitters to
                completely own their data.
              </p>
              <blockquote>
                <p>
                  <strong>How it works:</strong> Visit the{" "}
                  <a href={href("/styles")}>"Garden Styles"</a> directory page
                  and select a style to view. A page with identical content to
                  this one will be presented with a new design provided from a
                  contributed stylesheet. CSS practitioners of any skill level
                  are invited to{" "}
                  <a href={href("/contribute")}>submit a stylesheet</a>!
                </p>
              </blockquote>
              <p>
                The HTML for this page was created to be semantic, accessible,
                and free of nearly all other opinions. Nested sectioning
                elements with the class `.container` serve as additional style
                aids since you do not have access to alter the base HTML. IDs
                are included where needed for nav anchors or accessibility, and
                a small number of additional classes are provided for key
                elements without IDs. Don't forget the `.skip-link`!
              </p>
            </section>
            <section className="container">
              <h2>Modern CSS Under the Spotlight</h2>
              <p>
                Modern CSS has increased and improved the available CSS
                properties and layout behaviors, and browser support is nearly
                in sync for most high-touch features.
              </p>
              <p>Some examples of modern CSS include:</p>
              <ul>
                <li>Flexbox</li>
                <li>Grid</li>
                <li>custom variables</li>
                <li>@supports()</li>
                <li>gradients</li>
                <li>animation</li>
                <li>3D transforms</li>
                <li>object-fit</li>
                <li>:focus-within</li>
                <li>calc()</li>
                <li>min() / max() / clamp()</li>
                <li>viewport units</li>
                <li>scroll-(margin/padding/snap)</li>
                <li>position: sticky</li>
                <li>two-value display</li>
                <li>expanded media query values</li>
                <li>variable fonts</li>
              </ul>
              <p>
                We also collectively have an improved understanding of what it
                takes to make accessible experiences.
              </p>
              <p>
                <a href={href("/contribute")}>Join the AT Garden Club</a> to
                refresh your CSS skills, and learn from others!
              </p>
            </section>
          </article>
          <article id="guidelines">
            <section className="container">
              <h2>Guidelines</h2>
              <p>
                Contributing a stylesheet to AT Garden Club means you agree to
                abide by <a href={href("/guidelines")}>our full guidelines</a>.
              </p>
              <h3>TL;DR</h3>
              <p>
                All submissions will be autoprefixed and prepended with the{" "}
                <a href="https://creativecommons.org/licenses/by-nc-sa/3.0/">
                  CC BY-NC-SA license
                </a>{" "}
                as well as attribution using the metadata you provide. You may
                use any build setup you prefer, but the final submission should
                be the compiled, unminified CSS. You retain the copyright to
                original graphics and must ensure all graphics used are
                appropriately licensed. All asset links, including fonts, must
                be absolute to external resources. Stylesheets will be saved
                into the Github repo, and detected changes that violate the
                guidelines are cause for removal.
              </p>
              <p>
                Ensure your design is responsive, and that it passes accessible
                contrast (we'll be using aXe to verify). Animations should be
                removed via `prefers-reduced-motion`. Cutting-edge techniques
                should come with a fallback if needed to not severely impact the
                user experience. No content may be permanently hidden, and
                hidden items must come with an accessible viewing technique.
                Page load time should not exceed 3 seconds.
              </p>
              <p>
                Most importantly - have fun and learn something new! Check out
                the <a href={href("/resources")}>resources</a> for tips and
                inspiration.
              </p>
              <a href={href("/guidelines")} className="link-guidelines">
                Review full guidelines
              </a>
            </section>
          </article>
          <article id="contribute">
            <section className="container">
              <h2>Contribute</h2>
              <p>
                All who enjoy the craft of writing CSS are welcome to
                contribute!
              </p>
              <p>
                By participating as a contributor, your work will be shared with
                your provided attribution as long as Style Stage is online, your
                stylesheet link and any asset links remain valid, and all{" "}
                <a href={href("/guidelines")}>contributor guidelines</a> are
                adhered to.
              </p>
            </section>
            <section className="container">
              <h3>Steps to Contribute</h3>
              <ol>
                <li>
                  Download the source files listed below to use as a reference
                  to build your stylesheet, or start from the{" "}
                  <a href="http://codepen.io/pen?template=YPqbegK">
                    CodePen template
                  </a>
                  .
                </li>
                <li>
                  Create your stylesheet with your custom styles. Ensure all
                  asset links are absolute URLs to external resources.
                </li>
                <li>
                  Visit the <a href={href("/contribute")}>contribute page</a> to
                  submit your stylesheet. Thanks to the AT Protocol, you own
                  your data and your submission is stored on your personal data
                  server (PDS), giving you full control and portability.
                </li>
                <li>
                  Your submission is available immediately in the gallery!
                </li>
              </ol>
            </section>
            <footer id="files">
              <div className="container">
                <h3>Source Files</h3>
                <a
                  href={`https://stylestage.dev/styles/css/${defaultStyle.id}.css`}
                  className="link-downloadcss"
                  download="garden.css"
                >
                  Download CSS
                </a>{" "}
                <a
                  href="/"
                  download="garden.html"
                  className="link-downloadhtml"
                >
                  Download HTML
                </a>{" "}
                <a
                  href="http://codepen.io/pen?template=YPqbegK"
                  className="link-codepen"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Fork the CodePen
                </a>
              </div>
            </footer>
          </article>
        </Main>
        {style && didDocument ? (
          <CurrentlyStagedStyle
            author={didDocument.displayName}
            title={style.title}
            stylesheetHref={href("/styles/:userDidOrHandle/:rkey/styles.css", {
              userDidOrHandle: didDocument.displayName,
              rkey: new AtUri(style.uri).rkey,
            })}
            userDidOrHandle={didDocument.displayName}
          />
        ) : (
          <CurrentlyStagedStyle
            author={defaultStyle.by}
            title={defaultStyle.name}
            stylesheetHref={`https://stylestage.dev/styles/css/${defaultStyle.id}.css`}
          >
            {defaultStyle.twitterHandle && defaultStyle.twitterUrl ? (
              <CurrentlyStagedStyleSocialLink
                title="Twitter"
                displayName={defaultStyle.twitterHandle}
                href={defaultStyle.twitterUrl}
              />
            ) : null}
            {defaultStyle.websiteUrl ? (
              <CurrentlyStagedStyleWebsiteLink
                displayName={defaultStyle.websiteHandle}
                href={defaultStyle.websiteUrl}
              />
            ) : null}
          </CurrentlyStagedStyle>
        )}
        <FeaturedStyles />
      </Shell>
    </>
  );
}
