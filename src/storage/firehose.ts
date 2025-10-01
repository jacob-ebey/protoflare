import { AtUri } from "@atproto/syntax";
import { DurableObject } from "cloudflare:workers";

import { lexicons } from "~/lexicons/lexicons";

type JetStreamMessage<T extends string = string> = {
  did: string;
  time_us: number;
  type: string;
  kind: string;
  commit?: {
    rev: string;
    type: string;
    operation: string;
    collection: string;
    rkey: string;
    record: {
      $type: T;
    };
    cid: string;
  };
};

abstract class BaseFirehoseListener<
  Wanted extends readonly string[],
> extends DurableObject {
  lastEventTime: number;
  websocket: WebSocket | null = null;
  wantedCollections: Wanted;

  abstract handleMessage(
    message: JetStreamMessage<Wanted[number]>
  ): void | Promise<void>;

  constructor(ctx: DurableObjectState, env: Env, wantedCollections: Wanted) {
    super(ctx, env);

    this.wantedCollections = wantedCollections;

    this.lastEventTime = 0;
    ctx.blockConcurrencyWhile(async () => {
      this.lastEventTime = (await ctx.storage.get("lastEventTime")) ?? 0;
    });

    const onLoopError = (x: any) => {
      console.error("Loop failed with error: ", x);
      this.startLoop().catch(onLoopError);
    };

    this.startLoop().catch(onLoopError);
  }

  async startLoop() {
    this.ctx.blockConcurrencyWhile(async () => {
      let url = new URL("wss://jetstream1.us-west.bsky.network/subscribe");
      // "?wantedCollections=xyz.statusphere.status";
      // url += "&cursor=" + this.lastEventTime;
      url.searchParams.set("cursor", String(this.lastEventTime));
      for (const collection of this.wantedCollections) {
        url.searchParams.append("wantedCollections", collection);
      }

      console.info("Connecting to ", url.href);
      this.websocket = new WebSocket(url);
      this.websocket.addEventListener("open", (event) => {
        console.info("Connected to Jetstream.");
      });
      this.websocket.addEventListener("error", (err) => {
        console.error("Got error from WebSocket: ", err);
      });
      this.websocket.addEventListener("close", (event) => {
        console.info(
          "Disconnected from websocket connection to Jetstream. Resetting DO.",
          event
        );
        this.ctx.abort("Reset due to disconnect");
      });
      this.websocket.addEventListener("message", (event) => {
        const message: JetStreamMessage<Wanted[number]> = JSON.parse(
          event.data as string
        );

        this.lastEventTime = message.time_us;
        // Store this in the DOs storage in case the DO is restarted.

        if (message.kind === "commit" && message.commit) {
          const uri = `lex:${message.commit.collection}`;
          const lexicon = lexicons.get(uri);
          const valid = lexicon
            ? lexicons.validate(uri, message.commit.record)
            : { success: false };

          if (valid.success) {
            this.ctx.waitUntil(
              this.ctx.storage.put("lastEventTime", message.time_us)
            );
            this.handleMessage(message);
          }
        }
      });
    });

    await this.resetAlarm();
  }

  async resetAlarm() {
    const alarm = await this.ctx.storage.getAlarm();
    // If we have an alarm set that is not in the past then
    // don't set another one.
    if (alarm && alarm - Date.now() > 0) {
      return;
    }

    // Set an alarm 5 seconds in the future to ensure the DO stays alive.
    await this.ctx.storage.setAlarm(Date.now() + 5000);
  }

  async getLastEventTime() {
    return this.lastEventTime;
  }

  async alarm() {
    await this.resetAlarm();
  }
}

const wantedCollections = ["xyz.statusphere.status"] as const;

export class FirehoseListener extends BaseFirehoseListener<
  typeof wantedCollections
> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env, wantedCollections);
  }

  override async handleMessage(
    message: JetStreamMessage<(typeof wantedCollections)[number]>
  ) {
    if (message.kind === "commit" && message.commit) {
      const { $type: _, ...record } = message.commit.record;
      this.env.PDS.getByName(message.did).createRecord(
        {
          uri: AtUri.make(
            message.did,
            message.commit.collection,
            message.commit.rkey
          ).href,
          cid: message.commit.cid,
        },
        record
      );
    }
  }
}
