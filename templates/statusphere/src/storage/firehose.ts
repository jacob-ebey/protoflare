import { AtUri } from "@atproto/syntax";
import { FirehoseDurableObject } from "protoflare/server";

import * as lexicons from "~/lexicons/lexicons";

export class FirehoseListener extends FirehoseDurableObject<typeof lexicons> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(
      ctx,
      env,
      lexicons.lexicons,
      ["xyz.statusphere.status"],
      (message) => {
        if (message.kind === "commit") {
          switch (message.commit?.operation) {
            case "create": {
              const { $type: _, ...record } = message.commit.record;
              ctx.waitUntil(
                env.PDS.getByName(message.did).createRecord(
                  {
                    uri: AtUri.make(
                      message.did,
                      message.commit.collection,
                      message.commit.rkey,
                    ).href,
                    cid: message.commit.cid,
                  },
                  record,
                ),
              );
              break;
            }
            case "delete":
              ctx.waitUntil(
                env.PDS.getByName(message.did).deleteRecord({
                  collection: message.commit.collection,
                  repo: message.did,
                  rkey: message.commit.rkey,
                }),
              );
              break;
          }
        }
      },
    );
  }
}
