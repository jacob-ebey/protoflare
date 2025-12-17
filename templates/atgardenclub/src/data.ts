import { env } from "cloudflare:workers";

import * as otel from "@opentelemetry/api";
import * as sentry from "@sentry/cloudflare";
import { cache } from "react";
import { traceable } from "protoflare/otel";
import { resolveDidDocument, resolveDidFromHandle } from "protoflare/server";

function getDb(): typeof env.DB {
  return sentry.instrumentD1WithSentry(env.DB);
}

type Cursor = { id: number; createdAt: string };

const trace = otel.trace.getTracer("data");

function encodeCursor(cursor: Cursor): string {
  return btoa(
    JSON.stringify({ id: cursor.id, createdAt: cursor.createdAt }),
  ).replace(/=+$/g, "");
}

function decodeCursor(cursor: string | null | undefined): Cursor | undefined {
  if (cursor) {
    try {
      const data = JSON.parse(atob(cursor));
      if (
        data &&
        typeof data.id === "number" &&
        typeof data.createdAt === "string"
      ) {
        return data;
      }
    } catch (error) {}
  }
}

const sql = String.raw;

export const getLastEventTime = cache(
  traceable(trace, "getLastEventTime", async () => {
    const jetstream = env.JETSTREAM_CONSUMER.getByName("main");
    return await jetstream.getLastEventTime();
  }),
);

const getDidFromHandle = cache(
  traceable(trace, "getDidFromHandle", (async (handle) => {
    "use cache";
    return await resolveDidFromHandle(handle);
  }) as typeof resolveDidFromHandle),
);

export const getDidDocument = cache(
  traceable(trace, "getDidDocument", async (did: string) => {
    "use cache";

    const didDocument = await resolveDidDocument(did);
    return {
      ...didDocument,
      displayName:
        didDocument.alsoKnownAs?.[0]?.replace(/^at:\/\//, "") || didDocument.id,
    } satisfies typeof didDocument & { displayName: string };
  }),
);

export const getDidFromDidOrHandle = cache(
  traceable(trace, "getDidFromDidOrHandle", async (didOrHandle: string) => {
    if (didOrHandle.startsWith("did:")) {
      return didOrHandle;
    }
    return await getDidFromHandle(didOrHandle);
  }),
);

export type StyleStage = {
  uri: string;
  authorDid: string;
  title: string;
  styles: string;
  createdAt: string;
  indexedAt: string;
};

export type StyleStagePreview = Pick<
  StyleStage,
  "uri" | "authorDid" | "title" | "createdAt"
>;

export type ListResult<T> = {
  cursor: string | undefined;
  results: T[];
};

export const getStyle = cache(
  traceable(
    trace,
    "getStyle",
    async (userDid: string, rkey: string): Promise<StyleStage | undefined> => {
      const result = await getDb()
        .prepare(
          sql`
          SELECT uri, authorDid, title, styles, createdAt, indexedAt
          FROM stylestage
          WHERE uri = ?
          LIMIT 1
        `,
        )
        .bind(`at://${userDid}/club.atgarden.stylestage/${rkey}`)
        .first<StyleStage>();

      return result
        ? {
            authorDid: result.authorDid,
            title: result.title,
            styles: result.styles,
            createdAt: result.createdAt,
            indexedAt: result.indexedAt,
            uri: result.uri,
          }
        : undefined;
    },
  ),
);

export const listStyles = cache(
  traceable(
    trace,
    "listStyles",
    async ({
      cursor,
      limit = 20,
    }: { cursor?: string | null; limit?: number } = {}): Promise<
      ListResult<StyleStagePreview>
    > => {
      const decoded = decodeCursor(cursor);

      let results: (StyleStagePreview & { id: number })[];
      if (!decoded) {
        results = await getDb()
          .prepare(
            sql`
          SELECT id, uri, authorDid, createdAt, title FROM stylestage
          ORDER BY createdAt DESC, id DESC
          LIMIT ?
        `,
          )
          .bind(limit)
          .all<StyleStagePreview & { id: number }>()
          .then((r) => r.results);
      } else {
        results = await getDb()
          .prepare(
            sql`
            SELECT id, uri, authorDid, createdAt, title FROM stylestage
            WHERE (createdAt, id) < (?, ?)
            ORDER BY createdAt DESC, id DESC
            LIMIT ?
          `,
          )
          .bind(decoded.createdAt, decoded.id, limit)
          .all<StyleStagePreview & { id: number }>()
          .then((r) => r.results);
      }

      const lastResult = results.at(-1);
      return {
        cursor: lastResult ? encodeCursor(lastResult) : undefined,
        results: results.map(({ authorDid, createdAt, title, uri }) => ({
          authorDid,
          createdAt,
          title,
          uri,
        })),
      };
    },
  ),
);

export const listUserStyles = cache(
  traceable(
    trace,
    "listUserStyles",
    async (userDid: string): Promise<StyleStagePreview[]> => {
      const results = await getDb()
        .prepare(
          sql`
          SELECT id, uri, authorDid, createdAt, title FROM stylestage
          WHERE authorDid = ?
          ORDER BY createdAt DESC
        `,
        )
        .bind(userDid)
        .all<StyleStagePreview>();

      return results.results.map(({ authorDid, createdAt, title, uri }) => ({
        authorDid,
        createdAt,
        title,
        uri,
      }));
    },
  ),
);
