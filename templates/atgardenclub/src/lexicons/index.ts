/**
 * GENERATED CODE - DO NOT MODIFY
 */
import {
  XrpcClient,
  type FetchHandler,
  type FetchHandlerOptions,
} from "@atproto/xrpc";
import { schemas } from "./lexicons.js";
import { CID } from "multiformats/cid";
import { type OmitKey, type Un$Typed } from "./util.js";
import * as ComAtprotoRepoCreateRecord from "./types/com/atproto/repo/createRecord.js";
import * as ComAtprotoRepoDefs from "./types/com/atproto/repo/defs.js";
import * as ComAtprotoRepoDeleteRecord from "./types/com/atproto/repo/deleteRecord.js";
import * as ComAtprotoRepoGetRecord from "./types/com/atproto/repo/getRecord.js";
import * as ComAtprotoRepoListRecords from "./types/com/atproto/repo/listRecords.js";
import * as ComAtprotoRepoPutRecord from "./types/com/atproto/repo/putRecord.js";
import * as ClubAtgardenStylestage from "./types/club/atgarden/stylestage.js";

export * as ComAtprotoRepoCreateRecord from "./types/com/atproto/repo/createRecord.js";
export * as ComAtprotoRepoDefs from "./types/com/atproto/repo/defs.js";
export * as ComAtprotoRepoDeleteRecord from "./types/com/atproto/repo/deleteRecord.js";
export * as ComAtprotoRepoGetRecord from "./types/com/atproto/repo/getRecord.js";
export * as ComAtprotoRepoListRecords from "./types/com/atproto/repo/listRecords.js";
export * as ComAtprotoRepoPutRecord from "./types/com/atproto/repo/putRecord.js";
export * as ClubAtgardenStylestage from "./types/club/atgarden/stylestage.js";

export class AtpBaseClient extends XrpcClient {
  com: ComNS;
  club: ClubNS;

  constructor(options: FetchHandler | FetchHandlerOptions) {
    super(options, schemas);
    this.com = new ComNS(this);
    this.club = new ClubNS(this);
  }

  /** @deprecated use `this` instead */
  get xrpc(): XrpcClient {
    return this;
  }
}

export class ComNS {
  _client: XrpcClient;
  atproto: ComAtprotoNS;

  constructor(client: XrpcClient) {
    this._client = client;
    this.atproto = new ComAtprotoNS(client);
  }
}

export class ComAtprotoNS {
  _client: XrpcClient;
  repo: ComAtprotoRepoNS;

  constructor(client: XrpcClient) {
    this._client = client;
    this.repo = new ComAtprotoRepoNS(client);
  }
}

export class ComAtprotoRepoNS {
  _client: XrpcClient;

  constructor(client: XrpcClient) {
    this._client = client;
  }

  createRecord(
    data?: ComAtprotoRepoCreateRecord.InputSchema,
    opts?: ComAtprotoRepoCreateRecord.CallOptions,
  ): Promise<ComAtprotoRepoCreateRecord.Response> {
    return this._client
      .call("com.atproto.repo.createRecord", opts?.qp, data, opts)
      .catch((e) => {
        throw ComAtprotoRepoCreateRecord.toKnownErr(e);
      });
  }

  deleteRecord(
    data?: ComAtprotoRepoDeleteRecord.InputSchema,
    opts?: ComAtprotoRepoDeleteRecord.CallOptions,
  ): Promise<ComAtprotoRepoDeleteRecord.Response> {
    return this._client
      .call("com.atproto.repo.deleteRecord", opts?.qp, data, opts)
      .catch((e) => {
        throw ComAtprotoRepoDeleteRecord.toKnownErr(e);
      });
  }

  getRecord(
    params?: ComAtprotoRepoGetRecord.QueryParams,
    opts?: ComAtprotoRepoGetRecord.CallOptions,
  ): Promise<ComAtprotoRepoGetRecord.Response> {
    return this._client
      .call("com.atproto.repo.getRecord", params, undefined, opts)
      .catch((e) => {
        throw ComAtprotoRepoGetRecord.toKnownErr(e);
      });
  }

  listRecords(
    params?: ComAtprotoRepoListRecords.QueryParams,
    opts?: ComAtprotoRepoListRecords.CallOptions,
  ): Promise<ComAtprotoRepoListRecords.Response> {
    return this._client.call(
      "com.atproto.repo.listRecords",
      params,
      undefined,
      opts,
    );
  }

  putRecord(
    data?: ComAtprotoRepoPutRecord.InputSchema,
    opts?: ComAtprotoRepoPutRecord.CallOptions,
  ): Promise<ComAtprotoRepoPutRecord.Response> {
    return this._client
      .call("com.atproto.repo.putRecord", opts?.qp, data, opts)
      .catch((e) => {
        throw ComAtprotoRepoPutRecord.toKnownErr(e);
      });
  }
}

export class ClubNS {
  _client: XrpcClient;
  atgarden: ClubAtgardenNS;

  constructor(client: XrpcClient) {
    this._client = client;
    this.atgarden = new ClubAtgardenNS(client);
  }
}

export class ClubAtgardenNS {
  _client: XrpcClient;
  stylestage: ClubAtgardenStylestageRecord;

  constructor(client: XrpcClient) {
    this._client = client;
    this.stylestage = new ClubAtgardenStylestageRecord(client);
  }
}

export class ClubAtgardenStylestageRecord {
  _client: XrpcClient;

  constructor(client: XrpcClient) {
    this._client = client;
  }

  async list(
    params: OmitKey<ComAtprotoRepoListRecords.QueryParams, "collection">,
  ): Promise<{
    cursor?: string;
    records: { uri: string; value: ClubAtgardenStylestage.Record }[];
  }> {
    const res = await this._client.call("com.atproto.repo.listRecords", {
      collection: "club.atgarden.stylestage",
      ...params,
    });
    return res.data;
  }

  async get(
    params: OmitKey<ComAtprotoRepoGetRecord.QueryParams, "collection">,
  ): Promise<{
    uri: string;
    cid: string;
    value: ClubAtgardenStylestage.Record;
  }> {
    const res = await this._client.call("com.atproto.repo.getRecord", {
      collection: "club.atgarden.stylestage",
      ...params,
    });
    return res.data;
  }

  async create(
    params: OmitKey<
      ComAtprotoRepoCreateRecord.InputSchema,
      "collection" | "record"
    >,
    record: Un$Typed<ClubAtgardenStylestage.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = "club.atgarden.stylestage";
    const res = await this._client.call(
      "com.atproto.repo.createRecord",
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: "application/json", headers },
    );
    return res.data;
  }

  async put(
    params: OmitKey<
      ComAtprotoRepoPutRecord.InputSchema,
      "collection" | "record"
    >,
    record: Un$Typed<ClubAtgardenStylestage.Record>,
    headers?: Record<string, string>,
  ): Promise<{ uri: string; cid: string }> {
    const collection = "club.atgarden.stylestage";
    const res = await this._client.call(
      "com.atproto.repo.putRecord",
      undefined,
      { collection, ...params, record: { ...record, $type: collection } },
      { encoding: "application/json", headers },
    );
    return res.data;
  }

  async delete(
    params: OmitKey<ComAtprotoRepoDeleteRecord.InputSchema, "collection">,
    headers?: Record<string, string>,
  ): Promise<void> {
    await this._client.call(
      "com.atproto.repo.deleteRecord",
      undefined,
      { collection: "club.atgarden.stylestage", ...params },
      { headers },
    );
  }
}
