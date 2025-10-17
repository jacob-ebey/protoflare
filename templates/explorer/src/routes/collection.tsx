import { Fragment } from "react";
import type { Register } from "react-router";

import { listRecords } from "~/data";

export default async function Collection({
  params: { collection, repo, ...rest },
}: Register["pages"]["/at://:repo/:collection"]) {
  const records = await listRecords(repo, collection);

  return (
    <>
      <title>{`${collection} | Explorer`}</title>
      <meta name="description" content={`Collection ${collection}`} />

      <main>
        <section>
          <h1>{collection}</h1>

          {records.map((record) => (
            <details key={record.uri}>
              <summary>
                <span>{record.uri.split("/").at(-1)}</span>
                <br />
                <span>{record.cid}</span>
              </summary>
              <pre>
                <code>{JSON.stringify(record.value, null, 2)}</code>
              </pre>
            </details>
          ))}
        </section>
      </main>
    </>
  );
}
