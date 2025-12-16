import { Main, Shell } from "#components/layout";
import { defaultStyle } from "#og-styles";

export default function Contribute() {
  return (
    <>
      <title>Guidelines | AT Garden Club</title>
      <meta
        name="description"
        content="Review the full guidelines for contributing CSS stylesheets to AT Garden Club. Learn about accessibility requirements, licensing, and submission standards."
      />
      <link
        rel="stylesheet"
        href={`https://stylestage.dev/styles/css/${defaultStyle.id}.css`}
      />

      <Shell
        title="Guidelines"
        description="Bring your own flavors to the garden"
      >
        <Main>
          <article>
            <section className="container">
              <p>
                The HTML for this page was created to be semantic, accessible,
                and free of nearly all other opinions. While typically extra
                divs are to be avoided, each sectioning element also includes a{" "}
                <code>.container</code> div as the first child for use as a
                styling aid since you do not have access to alter the base HTML.
                IDs are included where needed for nav anchors or accessibility,
                and a small number of additional classes are provided for key
                elements without IDs.
              </p>
              <p>
                <strong>
                  As a contributor, you agree to abide by the following
                  guidelines and restrictions:
                </strong>
              </p>
              <ul>
                <li>
                  The HTML is not available to modify. Attribution is
                  automatically handled by the AT Protocol.
                </li>
                <li>
                  You may use any build setup you prefer to create your
                  stylesheet, but the final submission should be the compiled,
                  unminified CSS.
                </li>

                <li>
                  You retain copyright over original graphics, and your
                  stylesheet will receive the{" "}
                  <a href="https://creativecommons.org/licenses/by-nc-sa/3.0/">
                    CC BY-NC-SA license
                  </a>
                  .
                </li>
                <li>
                  All asset links, including fonts, must be absolute to external
                  resources. Broken asset links will lead to removal.
                </li>
                <li>
                  Page load time should not exceed 3 seconds.{" "}
                  <em>
                    Note: This site is built with Eleventy and hosted on
                    Netlify, so your local load time will likely be very close
                    to production load time.
                  </em>
                </li>
                <li>
                  There should be no contrast errors dedicated when validated
                  against tools like WAVE or aXe. Include any notes about false
                  errors in your pull request.
                </li>
                <li>
                  All graphic assets should respect copyright laws and be
                  licensed appropriately.
                </li>
                <li>
                  Designs should be responsive and usable across the most widely
                  supported browsers (check
                  <a href="https://caniuse.com">caniuse data</a> as needed)
                </li>
                <li>
                  When cutting-edge properties are used, appropriate fallbacks
                  should be provided if there is a significant impact on the
                  user experience, particularly as it relates to accessibility.
                </li>
                <li>
                  Animations should be removed via{" "}
                  <code>prefers-reduced-motion</code>. The reset included with
                  the source CSS demonstrates how to do this.
                </li>
                <li>
                  No content may be permanently hidden, and hidden items must
                  come with an accessible viewing technique.
                </li>
                <li>
                  Submissions will be rejected for using obscene, excessively
                  violent, or otherwise distasteful imagery, violating the above
                  guidelines, or other reasons at the discretion of the
                  maintainer. You may be asked to make revisions for minor
                  violations.
                </li>
                <li>
                  Submissions may be removed if future changes are made that
                  violate the guidelines, or if notice is received of copyright
                  violations.
                </li>
              </ul>
              <h2 id="faqs" tabIndex={-1}>
                FAQs
              </h2>
              <h3 id="what-pages-will-be-restyled" tabIndex={-1}>
                What pages will be restyled?
              </h3>
              <p>
                A dedicated page will be generated for your stylesheet that will
                restyle a copy of the home page only. Review the{" "}
                <a href="/#files">files</a> section to get the up-to-date source
                content.
              </p>
              <h3 id="how-do-i-submit-my-stylesheet" tabIndex={-1}>
                How do I submit my stylesheet?
              </h3>
              <p>
                Simply visit the <a href="/contribute">contribute page</a> and
                use the form to submit your stylesheet. Thanks to the AT
                Protocol, you don't need to host your stylesheet anywhere or
                create pull requests - just paste your CSS and submit. Your data
                is stored on your personal data server (PDS), giving you full
                ownership and control.
              </p>
            </section>
          </article>
        </Main>
      </Shell>
    </>
  );
}
