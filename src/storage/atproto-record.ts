import { DurableObject } from "cloudflare:workers";

import { TID } from "@atproto/common-web";
import { XrpcClient } from "@atproto/xrpc";

import { AtprotoOAuthClient } from "../lib/atproto-oauth-client";
import { AtpBaseClient } from "../lexicons";

const sql = String.raw;

const ownedRecords = new Set(["xyz.statusphere.status"]);

export class AtprotoRecordStorage extends DurableObject {
  constructor(state: DurableObjectState, env: Env) {
    super(state, env);

    state.storage.sql.exec(sql`
      CREATE TABLE IF NOT EXISTS records (
        rkey TEXT PRIMARY KEY,
        createdAt INTEGER,
        record TEXT
      )
    `);
  }

  async callXrpc(
    serializedState: SerializedState,
    pathSegments: string[],
    methodName: string,
    args: any[],
  ) {
    try {
      const oauthClient = await deserializeState(
        this.env.OAUTH_STORAGE,
        serializedState,
      );
      const fullPath = pathSegments.join(".");
      let current: any = oauthClient.xrpc;
      for (const segment of pathSegments) {
        current = current[segment];
        if (!current) {
          throw new Error(`Invalid path segment: ${segment}`);
        }
      }
      let method = current[methodName] as Function;
      if (typeof method !== "function") {
        throw new Error(`${fullPath}.${methodName} is not a function`);
      }
      method = method.bind(current);

      if (methodName === "create") {
        if (!args[0]?.repo) {
          throw new Error("repo is required");
        }

        if (!args[0].rkey) {
          args[0].rkey = TID.nextStr();
        }

        return this.ctx.storage.transaction(async () => {
          const res = this.ctx.storage.sql.exec(
            sql`
              INSERT INTO records (rkey, createdAt, record)
              VALUES (?, ?, ?)
            `,
            args[0].rkey,
            Date.now(),
            JSON.stringify(args[1]),
          );
          if (!res.rowsWritten) {
            throw new Error("Failed to create record");
          }

          return await method.apply(null, args);
        });
      }

      if (methodName === "list") {
        const { repo, limit = 100, reverse = false, cursor } = args[0];
        if (!repo) {
          throw new Error("repo is required");
        }
        const rows = this.ctx.storage.sql.exec(
          `
            SELECT rkey, record, createdAt FROM records
            ${cursor ? `WHERE createdAt ${reverse ? `>` : `<`} ${Number(cursor)}` : ``}
            ORDER BY createdAt ${reverse ? `ASC` : `DESC`}
            LIMIT ${Math.max(Math.min(limit, 100), 1)}
          `,
        );
        const records: { uri: string; value: any }[] = [];
        let newCursor: string | undefined = undefined;

        let row = rows.next();
        while (row.value) {
          newCursor = String(row.value.createdAt);
          records.push({
            uri: "",
            value: JSON.parse(String(row.value.record)),
          });

          row = rows.next();
        }

        return {
          cursor: newCursor,
          records,
        };
      }

      return await method.apply(null, args);
    } catch (err) {
      console.error("Error in callXrpc:", err);
      throw err;
    }
  }
}

type SerializedClientState = {
  accessToken: string;
  authServer: string;
  did: string;
  dpopNonce: string;
  handle: string;
  refreshToken?: string;
  serviceEndpoint: string;
  publicKey: JsonWebKey;
  privateKey: JsonWebKey;
};

type SerializedState = {
  callbackPathname: string;
  clientMetadataPathname: string;
  clientMetadata: any;
  state: SerializedClientState | undefined;
  url: string;
};

async function serializeState(
  client: AtprotoOAuthClient<any>,
): Promise<SerializedState> {
  let restState:
    | Omit<SerializedClientState, "publicKey" | "privateKey">
    | undefined = undefined;

  let privateKey: JsonWebKey | undefined = undefined;
  let publicKey: JsonWebKey | undefined = undefined;

  if (client.state) {
    let { keypair, ...rest } = client.state;
    restState = rest;
    const keys = client.state
      ? await Promise.all([
          crypto.subtle.exportKey("jwk", keypair.privateKey),
          crypto.subtle.exportKey("jwk", keypair.publicKey),
        ])
      : [];
    privateKey = keys[0];
    publicKey = keys[1];
  }

  return {
    callbackPathname: client.callbackPathname,
    clientMetadataPathname: client.clientMetadataPathname,
    clientMetadata: client.clientMetadata,
    state:
      restState && privateKey && publicKey
        ? {
            ...restState,
            privateKey,
            publicKey,
          }
        : undefined,
    url: client.url,
  };
}

async function deserializeState(
  namespace: KVNamespace,
  state: SerializedState,
): Promise<AtprotoOAuthClient<AtpBaseClient>> {
  const client = new AtprotoOAuthClient({
    AtpBaseClient,
    namespace,
    callbackPathname: state.callbackPathname,
    clientMetadata: state.clientMetadata,
    clientMetadataPathname: state.clientMetadataPathname,
    request: new Request(state.url),
  });

  if (state.state) {
    const {
      privateKey: privateKeyJwk,
      publicKey: publicKeyJwk,
      ...restState
    } = state.state;

    const [privateKey, publicKey] = await Promise.all([
      crypto.subtle.importKey(
        "jwk",
        privateKeyJwk,
        {
          name: "ECDSA",
          namedCurve: "P-256",
        },
        true,
        ["sign"],
      ),
      crypto.subtle.importKey(
        "jwk",
        publicKeyJwk,
        {
          name: "ECDSA",
          namedCurve: "P-256",
        },
        true,
        ["verify"],
      ),
    ]);

    client.state = {
      ...state.state,
      ...restState,
      keypair: {
        privateKey,
        publicKey,
      },
    };
  }
  return client;
}

type OmitKeysOf<From extends object, KeysToOmit extends object> = {
  [K in keyof From as K extends keyof KeysToOmit ? never : K]: From[K];
};

export function bindOauthClient<Client extends XrpcClient>(
  STORAGE: DurableObjectNamespace<AtprotoRecordStorage>,
  oauthClient: AtprotoOAuthClient<Client>,
): OmitKeysOf<Client, XrpcClient> {
  function createProxyForPath(base: any, currentPath: string[]): any {
    return new Proxy(base, {
      get(_, prop: string): any {
        // create
        // delete
        // get
        // list
        // put
        switch (prop) {
          case "create":
            return async (
              ...args: [{ repo: string }, ...any[]]
            ): Promise<unknown> => {
              if (!args[0]?.repo) {
                throw new Error("repo is required");
              }

              const storage = STORAGE.getByName(
                `${currentPath.join(".")}--${args[0].repo}`,
              );
              return await (storage as any).callXrpc(
                await serializeState(oauthClient),
                currentPath,
                prop,
                args,
              );
            };
          case "delete":
          case "put":
            throw new Error(`${prop} is not implemented`);
          case "get":
          case "list":
            return async (...args: any[]): Promise<unknown> => {
              if (!args[0]?.repo) {
                throw new Error("repo is required");
              }

              const storage = STORAGE.getByName(
                `${currentPath.join(".")}--${args[0].repo}`,
              );
              return await (storage as any).callXrpc(
                await serializeState(oauthClient),
                currentPath,
                prop,
                args,
              );
            };
          default:
            if (typeof base[prop] === "function") {
              return base[prop].bind(base);
            }
            return createProxyForPath(base[prop], [...currentPath, prop]);
        }
      },
    });
  }

  return createProxyForPath(oauthClient.xrpc, []);
}
