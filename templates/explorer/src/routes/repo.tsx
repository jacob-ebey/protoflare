import type { Register } from "react-router";
import { BoundaryError } from "protoflare/server";

import { getRepoDescription } from "~/data";
import { Link } from "~/components/ui/link";

export default async function RepoRoute({
  params: { repo },
}: Register["pages"]["/at://:repo"]) {
  const description = await getRepoDescription(repo).catch(() => null);

  if (!description) {
    throw new BoundaryError({
      status: 404,
      statusText: "Could not find repo.",
    });
  }

  return (
    <>
      <title>{`${description.handle} | Explorer`}</title>
      <meta name="description" content={`Repository for ${repo}`} />

      <main>
        <Repo repo={repo} />
      </main>
    </>
  );
}

export async function Repo({ repo }: { repo: string }) {
  const description = await getRepoDescription(repo).catch(() => null);

  if (!description) {
    return null;
  }

  const { handle, collections } = description;

  return (
    <section>
      <h1>{handle}</h1>
      <ul>
        {collections.map((collection) => (
          <li key={collection}>
            <Link href={`/at://${repo}/${collection}`}>{collection}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
