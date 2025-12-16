import { Link } from "react-router";
import { href, NavLink } from "react-router";

export function Shell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <header>
        <div className="container">
          <h1>{title}</h1>
          {description ? <h2>{description}</h2> : null}
          <a
            href="https://github.com/jacob-ebey/protoflare/tree/main/templates/atgardenclub"
            className="link-github"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 32 32"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M32 12.408l-11.056-1.607-4.944-10.018-4.944 10.018-11.056 1.607 8 7.798-1.889 11.011 9.889-5.199 9.889 5.199-1.889-11.011 8-7.798z"></path>
              </svg>{" "}
            </span>{" "}
            Star on Github
          </a>
        </div>
      </header>
      <nav>
        <ul>
          <li>
            <a href={`${href("/")}#about`}>About</a>
          </li>
          <li>
            <a href={`${href("/")}#guidelines`}>Guidelines</a>
          </li>
          <li>
            <a href={href("/styles")}>Garden Styles</a>
          </li>
          <li>
            <a href={href("/og-styles")}>OG Styles</a>
          </li>
          <li>
            <a href={href("/resources")}>Resources</a>
          </li>
          <li>
            <a href={href("/contribute")}>Contribute</a>
          </li>
        </ul>
      </nav>
      {children}
      <footer className="page-footer">
        <div className="container">
          <p>
            Created and maintained by{" "}
            <a
              href="https://bsky.app/profile/ebey.dev"
              target="_blank"
              rel="noopener noreferrer"
            >
              Jacob Ebey
            </a>
          </p>
          <ul>
            <li>
              <a
                href="https://github.com/jacob-ebey/protoflare/tree/main/templates/atgardenclub"
                className="link-github"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 32 32"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M32 12.408l-11.056-1.607-4.944-10.018-4.944 10.018-11.056 1.607 8 7.798-1.889 11.011 9.889-5.199 9.889 5.199-1.889-11.011 8-7.798z"></path>
                </svg>{" "}
                Star on Github
              </a>
            </li>
            <li>
              <a href={href("/feed")} className="link-rss">
                RSS Feed
              </a>
            </li>
            <li>
              <a href={href("/subscribe")} className="link-support">
                Subscribe to Updates
              </a>
            </li>
          </ul>
          <p>
            Crafted with semantic, accessible HTML and CSS,{" "}
            <strong>AT Garden Club</strong> is built with{" "}
            <a
              href="https://reactrouter.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              React Router
            </a>{" "}
            and hosted on{" "}
            <a
              href="https://cloudflare.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Cloudflare
            </a>
            . This project uses{" "}
            <a
              href="https://postcss.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              PostCSS
            </a>{" "}
            with{" "}
            <a
              href="https://github.com/postcss/autoprefixer/"
              target="_blank"
              rel="noopener noreferrer"
            >
              autoprefixer
            </a>
            .
          </p>
          <p>
            Contributors retain copyright of all graphics used, and styles are
            available under{" "}
            <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/">
              CC BY-NC-SA 4.0
            </a>
            .
          </p>
        </div>
      </footer>
    </>
  );
}

export function Main({ children }: { children?: React.ReactNode }) {
  return (
    <main id="main" tabIndex={-1}>
      <div className="container">{children}</div>
    </main>
  );
}
