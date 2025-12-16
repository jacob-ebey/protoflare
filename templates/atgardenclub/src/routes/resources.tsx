import { Main, Shell } from "#components/layout";
import { defaultStyle } from "#og-styles";

export default function Resources() {
  return (
    <>
      <title>Resources | AT Garden Club</title>
      <meta
        name="description"
        content="Get tips, tutorials, and inspiration for creating your AT Garden Club stylesheet. Learn modern CSS techniques, accessibility best practices, and styling strategies."
      />
      <link
        rel="stylesheet"
        href={`https://stylestage.dev/styles/css/${defaultStyle.id}.css`}
      />

      <Shell
        title="Resources"
        description="Resources to kickstart your journey"
      >
        <Main>
          <article>
            <section className="container">
              <p>
                Creating your AT Garden Club stylesheet will challenge you to
                explore techniques like flexbox and grid to arrange the page,
                and pseudo elements to add extra content and flair. Take the
                opportunity to design something a little unusual! So far,
                gradients and transform: skew() are popular with contributors ✨
              </p>
              <p>
                Play is a powerful teacher! How far can you push the boundaries
                while staying accessible and performant? These are skills worth
                practicing that will equip you to choose the right tool for the
                job in future projects. Even if the right tool is a framework,
                you will have a deeper understanding of how styles you apply are
                working and improve your ability to customize them.
              </p>
              <p>
                Trust me - it feels good to say: &quot;I can do that in
                CSS!&quot;
              </p>
              <h2 id="stylesheet-creation-tips" tabIndex={-1}>
                Stylesheet Creation Tips
              </h2>
              <blockquote>
                <p>
                  <strong>Want to get started quickly?</strong> You can fork the{" "}
                  <a href="http://codepen.io/pen?template=YPqbegK">
                    CodePen template
                  </a>{" "}
                  which includes the base HTML and allows you to experiment with
                  your styles in real-time as you build your submission.
                </p>
              </blockquote>
              <ul>
                <li>
                  <strong>Create inclusive, accessible styles</strong> - At
                  minimum, AT Garden Club guidelines require meeting accessible
                  contrast as well as removing animations via{" "}
                  <code>prefers-reduced-motion</code> (demonstrated in the
                  source CSS). Both of these things help create a more inclusive
                  web by ensuring users can enjoy interactive experiences with
                  less barriers. Additionally, ensure you retain accessible{" "}
                  <code>:focus</code> states for interactive elements. To test,
                  tab over your layout and if you loose track of where you've
                  tabbed, fix the <code>:focus</code>! If you're newer to web
                  accessibility,{" "}
                  <a href="https://dev.to/5t3ph/introduction-to-web-accessibility-5cmp">
                    Stephanie Eckles's intro article
                  </a>{" "}
                  covers contrast, keyboard interaction, and more including
                  additional resource links.
                </li>
                <li>
                  <strong>Accessible contrast required across states</strong> -
                  A common mistake for links styled as buttons is to lose
                  contrast for <code>:focus</code> or <code>:hover</code>{" "}
                  states, or not have enough contrast between the
                  &quot;button&quot; background and the surface behind the
                  button. Good news! I've created a web app to help you with
                  this contrast, check it out at{" "}
                  <a href="https://buttonbuddy.dev">ButtonBuddy.dev</a>.
                </li>
                <li>
                  <strong>Don't forget the skip link!</strong> - The{" "}
                  <code>.skip-link</code> is the first item in the HTML source's
                  body. On the Main Stage, it appears when in{" "}
                  <code>:focus</code>, which is expected to be the first
                  &quot;tab&quot; event into the browser window. This is useful
                  for users of assitive technology &quot;skip&quot; the
                  navigation and header fluff to get to the main content. Be
                  sure to give it a style! You can certainly choose to have it
                  always visible.
                </li>
                <li>
                  <strong>Use a style reset</strong> - The source styles include
                  a modified version of Andy Bell's{" "}
                  <a href="https://github.com/hankchizljaw/modern-css-reset">
                    Modern CSS Reset
                  </a>
                </li>
                <li>
                  <strong>Inspect!</strong> - All modern browsers have an
                  &quot;Inspector&quot; built in which allows you to choose an
                  element on the page and quickly learn more about its HTML
                  structure and related styles. Spend a bit of time learning
                  tricks about the Inspector included in your favorite browser!
                </li>
                <li>
                  <strong>Become one with the cascade</strong> - The
                  &quot;C&quot; in CSS is going to be your greatest enabler on
                  this project. With limited availability of classes and IDs,
                  you will have much greater success by working <em>with</em>{" "}
                  inheritance. Need a refresher?{" "}
                  <a href="https://dev.to/5t3ph/intro-to-the-css-cascade-the-c-in-css-1kh0">
                    Check out Stephanie Eckles's episode about the cascade
                  </a>{" "}
                  from their web development course for beginners.
                </li>
                <li>
                  <strong>Learn about CSS selectors</strong> - Because the Style
                  Stage HTML offers very minimal classes and IDs, you'll want to
                  get familiar with the wide range of ways you can select
                  elements in CSS. I really love this interactive game that
                  covers <em>32</em> selector combinations:{" "}
                  <a href="https://flukeout.github.io/">CSS Diner</a>. I've also
                  written{" "}
                  <a href="https://moderncss.dev/guide-to-advanced-css-selectors-part-one/">
                    an in-depth guide to advanced CSS selectors
                  </a>{" "}
                  including examples.
                </li>
                <li>
                  <strong>Cozy up to pseudo elements</strong> - You may not be
                  allowed to alter the HTML, but that doesn't mean you can't add
                  extra elements!{" "}
                  <a href="https://css-tricks.com/pseudo-element-roundup/">
                    Pseudo elements
                  </a>{" "}
                  allow you to prepend and append extra content, greatly
                  expanding the styling opportunities. In theory you could add
                  two extra elements to every element in the page and... well
                  I'm not going to do the math, but it's a lot of extra
                  elements! These can hold things like extra backgrounds, SVGs,
                  and even text (it's how the &quot;coach marks&quot; are
                  applied on the Main Stage). Check out Stephanie Eckles's guide
                  to{" "}
                  <a href="https://moderncss.dev/guide-to-advanced-css-selectors-part-two/">
                    learn more about using pseudo elements
                  </a>
                  .
                </li>
                <li>
                  <strong>Try out CSS custom properties</strong> - The source
                  CSS makes use of{" "}
                  <a href="https://12daysofweb.dev/2021/css-custom-properties/">
                    CSS custom properties
                  </a>{" "}
                  (aka &quot;variables&quot;). Learn from experts like{" "}
                  <a href="https://www.smashingmagazine.com/2019/07/css-custom-properties-cascade/">
                    Miriam Suzanne
                  </a>{" "}
                  (who is a Style Stage contributor!) and{" "}
                  <a href="https://www.sarasoueidan.com/blog/style-settings-with-css-variables/">
                    Sara Soueidan
                  </a>
                  .
                </li>
                <li>
                  <strong>Test the most modern CSS</strong> - What interesting
                  techniques can you create with <code>:focus-within</code>?
                  Have you tried out grid yet? What about creating an enhanced
                  experience with cutting-edge features by testing for them with{" "}
                  <code>@supports</code>?
                </li>
                <li>
                  <strong>Review all stylesheets</strong> - Don't just look -
                  scroll! Hover! Resize! Most importantly - inspect!
                </li>
              </ul>
            </section>
          </article>
        </Main>
      </Shell>
    </>
  );
}
