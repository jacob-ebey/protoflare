import { AtUri } from "@atproto/syntax";
import autoprefixer from "autoprefixer";
import postcss from "postcss";
import { JetstreamConsumerDurableObject } from "protoflare/server";

import * as lexicons from "#lexicons/lexicons";
import * as StyleStage from "#lexicons/types/club/atgarden/stylestage";

const wantedCollections = ["club.atgarden.stylestage"] as const;

const sql = String.raw;

export class JetstreamConsumer extends JetstreamConsumerDurableObject<
  typeof lexicons,
  typeof wantedCollections
> {
  constructor(ctx: DurableObjectState, env: Env) {
    env.DB.prepare(sql``).first();

    super(ctx, env, {
      lexicons: lexicons.lexicons,
      wantedCollections,
      // December 14
      backfillStart: 1765785600000,
      handleMessage: async (message) => {
        switch (message.commit?.collection) {
          case "club.atgarden.stylestage":
            if (message.kind === "commit") {
              switch (message.commit?.operation) {
                case "create":
                case "update": {
                  const record = message.commit.record as StyleStage.Record;

                  let { css } = await postcss([autoprefixer()])
                    .process(record.styles)
                    .catch(() => ({ css: "" }));
                  css = css.trim();

                  if (!css) return;

                  const uri = AtUri.make(
                    message.did,
                    message.commit.collection,
                    message.commit.rkey,
                  );

                  await env.DB.prepare(
                    sql`
                      INSERT INTO stylestage (
                        uri, authorDid, title, styles, createdAt, indexedAt
                      ) VALUES (?, ?, ?, ?, ?, ?)
                      ON CONFLICT(uri) DO UPDATE SET
                        title = excluded.title,
                        styles = excluded.styles,
                        indexedAt = excluded.indexedAt;
                    `,
                  )
                    .bind(
                      uri.href,
                      message.did,
                      record.title,
                      record.styles,
                      record.createdAt,
                      new Date().toISOString(),
                    )
                    .run();

                  // this.ctx.waitUntil(revalidateTag("stylestage"));
                  // this.ctx.waitUntil(revalidateTag(`stylestage/${uri.href}`));
                  break;
                }
                case "delete": {
                  const uri = AtUri.make(
                    message.did,
                    message.commit.collection,
                    message.commit.rkey,
                  );
                  await env.DB.prepare(
                    sql`
                      DELETE FROM stylestage WHERE uri = ?;
                    `,
                  )
                    .bind(uri.href)
                    .run();

                  // this.ctx.waitUntil(revalidateTag("stylestage"));
                  // this.ctx.waitUntil(revalidateTag(`stylestage/${uri.href}`));
                  break;
                }
              }
            }
            break;
        }
      },
    });
  }
}
