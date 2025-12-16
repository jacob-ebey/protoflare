import { getDidDocument, listStyles, StyleStagePreview } from "#data";
import { AtUri } from "@atproto/syntax";
import { cacheLife, cacheTag } from "protoflare/server";
import { href } from "react-router";

export function CurrentlyStagedStyle({
  author,
  children,
  stylesheetHref,
  title,
  userDidOrHandle,
}: {
  author: string;
  children?: React.ReactNode;
  stylesheetHref: string;
  title: string;
  userDidOrHandle?: string;
}) {
  return (
    <aside className="profile" aria-labelledby="profile-title">
      <div className="container">
        <h4 id="profile-title">Currently Staged Style</h4>
        <ul>
          <li className="profile-title">
            <span>Title:</span> <span>{title}</span>
          </li>
          <li className="profile-author">
            <span>Author:</span>{" "}
            {userDidOrHandle ? (
              <a
                href={`https://bsky.app/profile/${author}`}
                rel="noopener noreferrer"
                target="_blank"
              >
                {author}
              </a>
            ) : (
              <span>{author}</span>
            )}
          </li>
          {children}
        </ul>
        <a href={stylesheetHref} target="_blank">
          View Stylesheet
        </a>
      </div>
    </aside>
  );
}

export function CurrentlyStagedStyleSocialLink({
  displayName,
  href,
  title,
}: {
  displayName: string;
  href: string;
  title: "Bluesky" | "Twitter";
}) {
  return (
    <li className="profile-twitter">
      <span>{title}</span>{" "}
      <span>
        <a href={href} target="_blank" rel="noopener noreferrer">
          {displayName}
        </a>
      </span>
    </li>
  );
}

export function CurrentlyStagedStyleWebsiteLink({
  displayName,
  href,
}: {
  displayName: string;
  href: string;
}) {
  return (
    <li className="profile-twitter">
      <span>Website</span>{" "}
      <span>
        <a href={href} target="_blank" rel="noopener noreferrer">
          {displayName}
        </a>
      </span>
    </li>
  );
}

export async function FeaturedStyles() {
  "use cache";
  cacheLife("seconds");
  cacheTag("stylesstage");

  const { results } = await listStyles({ limit: 3 });

  return (
    <aside id="styles">
      <div className="container">
        <h2>Latest Styles</h2>
        <ul className="features">
          {results.map((style) => (
            <FeaturedStyle key={style.uri} style={style} />
          ))}
        </ul>

        <a href={href("/styles")} className="link-allstyles">
          View Garden Styles
        </a>
      </div>
    </aside>
  );
}

async function FeaturedStyle({ style }: { style: StyleStagePreview }) {
  const didDocument = await getDidDocument(style.authorDid);
  const uri = new AtUri(style.uri);

  return (
    <li>
      <span>
        <a
          href={href("/styles/:userDidOrHandle/:rkey", {
            rkey: uri.rkey,
            userDidOrHandle: didDocument.displayName,
          })}
        >
          {style.title}
          <span aria-hidden="true"></span>
        </a>{" "}
        <span>by {didDocument.displayName}</span>
      </span>
    </li>
  );
}
