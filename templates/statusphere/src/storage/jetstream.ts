import { AtUri } from "@atproto/syntax";
import { JetstreamConsumerDurableObject } from "protoflare/server";

import * as lexicons from "~/lexicons/lexicons";
import * as Status from "~/lexicons/types/xyz/statusphere/status";

const wantedCollections = ["xyz.statusphere.status"] as const;

export class JetstreamConsumer extends JetstreamConsumerDurableObject<
  typeof lexicons,
  typeof wantedCollections
> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env, {
      lexicons: lexicons.lexicons,
      wantedCollections,
      handleMessage: async (message) => {
        switch (message.commit?.collection) {
          case "xyz.statusphere.status":
            if (message.kind === "commit") {
              switch (message.commit?.operation) {
                case "create": {
                  const record = message.commit.record as Status.Record;

                  await env.DB.prepare(
                    /* SQL */ `
                    INSERT INTO status (
                      uri, authorDid, status, createdAt, indexedAt
                    ) VALUES (?, ?, ?, ?, ?)
                    ON CONFLICT(uri) DO UPDATE SET
                      status = excluded.status,
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
                      record.status,
                      record.createdAt,
                      new Date().toISOString(),
                    )
                    .run();
                  break;
                }
                case "delete":
                  await env.DB.prepare(
                    /* SQL */ `
                  DELETE FROM status WHERE uri = ?;
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
