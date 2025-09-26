import { DurableObject } from "cloudflare:workers";

import * as StatusphereStatus from "../lexicons/types/xyz/statusphere/status";

import { SimplifyRecord } from "./utils";

export type StatusRecord = SimplifyRecord<StatusphereStatus.Record> & {
  uri: string;
};

export class StatusStorage extends DurableObject {
  private status: StatusRecord | undefined;

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);

    state.blockConcurrencyWhile(async () => {
      this.status = await state.storage.get<StatusRecord>("status");
    });
  }

  async getStatus(): Promise<StatusRecord | undefined> {
    return this.status;
  }

  async setStatus(record: StatusRecord): Promise<void> {
    this.status = record;
    this.ctx.waitUntil(
      Promise.all([
        this.ctx.blockConcurrencyWhile(() =>
          this.ctx.storage.put("status", record),
        ),
        this.ctx.storage.put(
          `status-${new Date(record.createdAt).getTime()}`,
          record,
        ),
      ]),
    );
  }
}
