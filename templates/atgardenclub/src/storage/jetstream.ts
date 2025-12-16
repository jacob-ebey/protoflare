import { AtUri } from "@atproto/syntax";
import autoprefixer from "autoprefixer";
import postcss from "postcss";
import { JetstreamConsumerDurableObject } from "protoflare/server";

import * as lexicons from "#lexicons/lexicons";
import * as StyleStage from "#lexicons/types/club/atgarden/stylestage";

const wantedCollections = ["club.atgarden.stylestage"] as const;

export class JetstreamConsumer extends JetstreamConsumerDurableObject<
  typeof lexicons,
  typeof wantedCollections
> {
  constructor(ctx: DurableObjectState, env: Env) {
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
                    .catch((reason) => ({ css: "" }));
                  css = css.trim();

                  if (!css) return;

                  await env.DB.prepare(
                    /* SQL */ `
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
                      AtUri.make(
                        message.did,
                        message.commit.collection,
                        message.commit.rkey,
                      ).href,
                      message.did,
                      record.title,
                      record.styles,
                      record.createdAt,
                      new Date().toISOString(),
                    )
                    .run();
                  break;
                }
                case "delete":
                  await env.DB.prepare(
                    /* SQL */ `
                  DELETE FROM stylestage WHERE uri = ?;
                `,
                  )
                    .bind(
                      AtUri.make(
                        message.did,
                        message.commit.collection,
                        message.commit.rkey,
                      ).href,
                    )
                    .run();

                  break;
              }
            }
            break;
        }
      },
    });
  }
}
