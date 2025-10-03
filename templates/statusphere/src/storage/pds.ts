import { AtUri } from "@atproto/syntax";
import { DurableObject } from "cloudflare:workers";

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

    try {
      const { host } = AtUri.make(uri);
      using res = await REPO.getByName(host).createRecord({ cid, uri }, record);
      return { success: res.success };
    } catch (error) {
      console.error("Failed to call REPO.createRecord", error);
      return { success: false };
    }
  }

  async deleteRecord({
    collection,
    repo,
    rkey,
  }: {
    collection: string;
    repo: string;
    rkey: string;
  }) {
    const {
      env: { REPO },
    } = this;

    try {
      using res = await REPO.getByName(repo).deleteRecord({ collection, rkey });
      return { success: res.success };
    } catch (error) {
      console.error("Failed to call REPO.deleteRecord", error);
      return { success: false };
    }
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

    try {
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

      return { success: true };
    } catch (error) {
      console.error("Failed to insert record", error);
      return { success: false };
    }
  }

  async deleteRecord({
    collection,
    rkey,
  }: {
    collection: string;
    rkey: string;
  }): Promise<{ success: boolean }> {
    const {
      storage: { sql },
    } = this.ctx;

    try {
      sql.exec(
        /* SQL */ `
          DELETE FROM records
          WHERE \`collection\` = ? AND rkey = ?;
        `,
        collection,
        rkey,
      );
      return { success: true };
    } catch (error) {
      console.error("Failed to delete record", error);
      return { success: false };
    }
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
      ${cursor ? `AND rkey ${reverse ? ">" : "<"} ?` : ""}
      ORDER BY rkey ${order}, cid ${order}
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
