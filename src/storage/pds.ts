import { AtUri } from "@atproto/syntax";
import { DurableObject } from "cloudflare:workers";

import { Effect, Either } from "effect";

type RecordList = {
  cursor?: string;
  records: {
    uri: string;
    cid: string;
    value: { $type: string };
  }[];
};

export class PDS extends DurableObject {
  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
  }

  async createRecord(
    { cid, uri }: { cid: string; uri: string },
    record: unknown,
  ): Promise<{ success: boolean }> {
    const {
      env: { REPO },
    } = this;

    const { host } = AtUri.make(uri);

    const createRecord = Effect.tryPromise(async () =>
      REPO.getByName(host).createRecord({ cid, uri }, record),
    );

    return await Effect.runPromise(
      Effect.gen(function* () {
        const createResult = yield* Effect.either(createRecord);
        if (Either.isLeft(createResult)) {
          yield* Effect.logError(
            "Failed to call REPO.createRecord",
            createResult.left,
          );

          return { success: false };
        }

        return { success: true };
      }),
    );
  }

  async listRecords({
    collection,
    cursor,
    limit,
    repo,
    reverse,
  }: {
    collection: string;
    cursor?: string;
    limit?: number;
    repo: string;
    reverse?: boolean;
  }): Promise<RecordList> {
    const repoStub = this.env.REPO.getByName(repo);
    using results = await repoStub.listRecords({
      collection,
      cursor,
      limit,
      repo,
      reverse,
    });
    return {
      records: results.records,
      cursor: results.cursor,
    };
  }
}

export class RepoStorage extends DurableObject {
  constructor(state: DurableObjectState, env: Env) {
    super(state, env);

    const {
      storage: { sql },
    } = this.ctx;

    sql.exec(/* SQL */ `
      CREATE TABLE IF NOT EXISTS records (
        cid TEXT NOT NULL,
        collection TEXT NOT NULL,
        rkey TEXT NOT NULL,
        record TEXT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_records_cid_collection_rkey ON records (cid, collection, rkey);
    `);
  }

  async createRecord(
    { cid, uri }: { cid: string; uri: string },
    record: unknown,
  ): Promise<{ success: boolean }> {
    const {
      storage: { sql },
    } = this.ctx;

    const insertRecord = Effect.try(() => {
      const { collection, rkey } = AtUri.make(uri);

      const inserted = sql.exec(
        /* SQL */ `
          INSERT INTO records (cid, collection, rkey, record)
          VALUES (?, ?, ?, ?);
        `,
        cid,
        collection,
        rkey,
        JSON.stringify(record),
      );
      if (!inserted.rowsWritten) {
        throw new Error("records row not written to database");
      }
    });

    return await Effect.runPromise(
      Effect.gen(function* () {
        const res = yield* Effect.either(insertRecord);
        if (Either.isLeft(res)) {
          yield* Effect.logError("Failed to insert record", res.left);
          return { success: false };
        }
        return { success: true };
      }),
    );
  }

  async getRecord({
    cid,
    collection,
    rkey,
  }: {
    cid?: string;
    collection: string;
    rkey: string;
  }) {
    //
  }

  async listRecords({
    collection,
    cursor,
    limit,
    repo,
    reverse,
  }: {
    collection: string;
    cursor?: string;
    limit?: number;
    repo: string;
    reverse?: boolean;
  }): Promise<RecordList> {
    const {
      storage: { sql },
    } = this.ctx;
    limit = Math.max(0, Math.min(limit ?? 100, 100));

    const order = reverse ? "ASC" : "DESC";
    const params: (string | number)[] = [collection];
    if (cursor) {
      params.push(cursor);
    }
    params.push(limit);

    const query = /* SQL */ `
      SELECT cid, rkey, record
      FROM records
      WHERE collection = ?
      ${
        cursor
          ? `AND createdAt ${reverse ? ">" : "<"} (
              SELECT createdAt
              FROM records
              WHERE rkey = ?
            )
          `
          : ""
      }
      ORDER BY createdAt ${order}
      LIMIT ?;
    `;

    const results = sql.exec<{
      cid: string;
      rkey: string;
      record: string;
    }>(query, ...params);
    const records = results.toArray().map((row) => ({
      uri: AtUri.make(repo, collection, row.rkey).href,
      cid: row.cid as string,
      value: {
        $type: collection,
        ...JSON.parse(row.record as string),
      },
    }));

    let newCursor: string | undefined;
    if (records.length === limit) {
      const uri = AtUri.make(records[records.length - 1].uri, collection);
      newCursor = uri.rkey;
    }

    return {
      records,
      cursor: newCursor,
    };
  }
}
