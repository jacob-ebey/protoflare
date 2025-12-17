import { env } from "cloudflare:workers";

import { trace } from "@opentelemetry/api";
import { cache } from "react";
import { resolveDidDocument, resolveDidFromHandle } from "protoflare/server";

type Cursor = { id: number; createdAt: string };

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

export const getLastEventTime = cache(async () => {
  return await trace
    .getTracer("at-garden-club")
    .startActiveSpan("getLastEventTime", async (span) => {
      try {
        const jetstream = env.JETSTREAM_CONSUMER.getByName("main");
        const result = await jetstream.getLastEventTime();
        return result;
      } finally {
        span.end();
      }
    });
});

const getDidFromHandle = cache<typeof resolveDidFromHandle>(async (...args) => {
  "use cache";

  return await trace
    .getTracer("at-garden-club")
    .startActiveSpan("getDidFromHandle", async (span) => {
      try {
        const did = await resolveDidFromHandle(...args);
        return did;
      } finally {
        span.end();
      }
    });
});

export const getDidDocument = cache(
  async (...args: Parameters<typeof resolveDidDocument>) => {
    "use cache";

    return await trace
      .getTracer("at-garden-club")
      .startActiveSpan("getDidDocument", async (span) => {
        try {
          const didDocument = await resolveDidDocument(...args);
          const result = {
            ...didDocument,
            displayName:
              didDocument.alsoKnownAs?.[0]?.replace(/^at:\/\//, "") ||
              didDocument.id,
          } satisfies typeof didDocument & { displayName: string };
          return result;
        } finally {
          span.end();
        }
      });
  },
);

export const getDidFromDidOrHandle = cache(async (didOrHandle: string) => {
  return await trace
    .getTracer("at-garden-club")
    .startActiveSpan("getDidFromDidOrHandle", async (span) => {
      try {
        if (didOrHandle.startsWith("did:")) {
          return didOrHandle;
        }

        const did = await getDidFromHandle(didOrHandle);
        return did;
      } finally {
        span.end();
      }
    });
});

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
  async (userDid: string, rkey: string): Promise<StyleStage | undefined> => {
    return await trace
      .getTracer("at-garden-club")
      .startActiveSpan("getStyle", async (span) => {
        try {
          const result = await env.DB.prepare(
            sql`
            SELECT uri, authorDid, title, styles, createdAt, indexedAt
            FROM stylestage
            WHERE uri = ?
            LIMIT 1
          `,
          )
            .bind(`at://${userDid}/club.atgarden.stylestage/${rkey}`)
            .first<StyleStage>();

          const res = result
            ? {
                authorDid: result.authorDid,
                title: result.title,
                styles: result.styles,
                createdAt: result.createdAt,
                indexedAt: result.indexedAt,
                uri: result.uri,
              }
            : undefined;

          return res;
        } finally {
          span.end();
        }
      });
  },
);

export const listStyles = cache(
  async ({
    cursor,
    limit = 20,
  }: { cursor?: string | null; limit?: number } = {}): Promise<
    ListResult<StyleStagePreview>
  > => {
    return await trace
      .getTracer("at-garden-club")
      .startActiveSpan("listStyles", async (span) => {
        try {
          const decoded = decodeCursor(cursor);

          let results: (StyleStagePreview & { id: number })[];
          if (!decoded) {
            results = await env.DB.prepare(
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
            results = await env.DB.prepare(
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
          const res = {
            cursor: lastResult ? encodeCursor(lastResult) : undefined,
            results: results.map(({ authorDid, createdAt, title, uri }) => ({
              authorDid,
              createdAt,
              title,
              uri,
            })),
          };

          return res;
        } finally {
          span.end();
        }
      });
  },
);

export const listUserStyles = cache(
  async (userDid: string): Promise<StyleStagePreview[]> => {
    return await trace
      .getTracer("at-garden-club")
      .startActiveSpan("listUserStyles", async (span) => {
        try {
          const results = await env.DB.prepare(
            sql`
            SELECT id, uri, authorDid, createdAt, title FROM stylestage
            WHERE authorDid = ?
            ORDER BY createdAt DESC
          `,
          )
            .bind(userDid)
            .all<StyleStagePreview>();

          const res = results.results.map(
            ({ authorDid, createdAt, title, uri }) => ({
              authorDid,
              createdAt,
              title,
              uri,
            }),
          );

          return res;
        } finally {
          span.end();
        }
      });
  },
);
