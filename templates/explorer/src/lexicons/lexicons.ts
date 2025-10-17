/**
 * GENERATED CODE - DO NOT MODIFY
 */
import {
  type LexiconDoc,
  Lexicons,
  ValidationError,
  type ValidationResult,
} from "@atproto/lexicon";
import { type $Typed, is$typed, maybe$typed } from "./util.js";

export const schemaDict = {
  ComAtprotoRepoCreateRecord: {
    lexicon: 1,
    id: "com.atproto.repo.createRecord",
    defs: {
      main: {
        type: "procedure",
        description:
          "Create a single new repository record. Requires auth, implemented by PDS.",
        input: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["repo", "collection", "record"],
            properties: {
              repo: {
                type: "string",
                format: "at-identifier",
                description:
                  "The handle or DID of the repo (aka, current account).",
              },
              collection: {
                type: "string",
                format: "nsid",
                description: "The NSID of the record collection.",
              },
              rkey: {
                type: "string",
                format: "record-key",
                description: "The Record Key.",
                maxLength: 512,
              },
              validate: {
                type: "boolean",
                description:
                  "Can be set to 'false' to skip Lexicon schema validation of record data, 'true' to require it, or leave unset to validate only for known Lexicons.",
              },
              record: {
                type: "unknown",
                description: "The record itself. Must contain a $type field.",
              },
              swapCommit: {
                type: "string",
                format: "cid",
                description:
                  "Compare and swap with the previous commit by CID.",
              },
            },
          },
        },
        output: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["uri", "cid"],
            properties: {
              uri: {
                type: "string",
                format: "at-uri",
              },
              cid: {
                type: "string",
                format: "cid",
              },
              commit: {
                type: "ref",
                ref: "lex:com.atproto.repo.defs#commitMeta",
              },
              validationStatus: {
                type: "string",
                knownValues: ["valid", "unknown"],
              },
            },
          },
        },
        errors: [
          {
            name: "InvalidSwap",
            description:
              "Indicates that 'swapCommit' didn't match current repo commit.",
          },
        ],
      },
    },
  },
  ComAtprotoRepoDefs: {
    lexicon: 1,
    id: "com.atproto.repo.defs",
    defs: {
      commitMeta: {
        type: "object",
        required: ["cid", "rev"],
        properties: {
          cid: {
            type: "string",
            format: "cid",
          },
          rev: {
            type: "string",
            format: "tid",
          },
        },
      },
    },
  },
  ComAtprotoRepoDeleteRecord: {
    lexicon: 1,
    id: "com.atproto.repo.deleteRecord",
    defs: {
      main: {
        type: "procedure",
        description:
          "Delete a repository record, or ensure it doesn't exist. Requires auth, implemented by PDS.",
        input: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["repo", "collection", "rkey"],
            properties: {
              repo: {
                type: "string",
                format: "at-identifier",
                description:
                  "The handle or DID of the repo (aka, current account).",
              },
              collection: {
                type: "string",
                format: "nsid",
                description: "The NSID of the record collection.",
              },
              rkey: {
                type: "string",
                format: "record-key",
                description: "The Record Key.",
              },
              swapRecord: {
                type: "string",
                format: "cid",
                description:
                  "Compare and swap with the previous record by CID.",
              },
              swapCommit: {
                type: "string",
                format: "cid",
                description:
                  "Compare and swap with the previous commit by CID.",
              },
            },
          },
        },
        output: {
          encoding: "application/json",
          schema: {
            type: "object",
            properties: {
              commit: {
                type: "ref",
                ref: "lex:com.atproto.repo.defs#commitMeta",
              },
            },
          },
        },
        errors: [
          {
            name: "InvalidSwap",
          },
        ],
      },
    },
  },
  ComAtprotoRepoDescribeRepo: {
    lexicon: 1,
    id: "com.atproto.repo.describeRepo",
    defs: {
      main: {
        type: "query",
        description:
          "Get information about an account and repository, including the list of collections. Does not require auth.",
        parameters: {
          type: "params",
          required: ["repo"],
          properties: {
            repo: {
              type: "string",
              format: "at-identifier",
              description: "The handle or DID of the repo.",
            },
          },
        },
        output: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: [
              "handle",
              "did",
              "didDoc",
              "collections",
              "handleIsCorrect",
            ],
            properties: {
              handle: {
                type: "string",
                format: "handle",
              },
              did: {
                type: "string",
                format: "did",
              },
              didDoc: {
                type: "unknown",
                description: "The complete DID document for this account.",
              },
              collections: {
                type: "array",
                description:
                  "List of all the collections (NSIDs) for which this repo contains at least one record.",
                items: {
                  type: "string",
                  format: "nsid",
                },
              },
              handleIsCorrect: {
                type: "boolean",
                description:
                  "Indicates if handle is currently valid (resolves bi-directionally)",
              },
            },
          },
        },
      },
    },
  },
  ComAtprotoRepoGetRecord: {
    lexicon: 1,
    id: "com.atproto.repo.getRecord",
    defs: {
      main: {
        type: "query",
        description:
          "Get a single record from a repository. Does not require auth.",
        parameters: {
          type: "params",
          required: ["repo", "collection", "rkey"],
          properties: {
            repo: {
              type: "string",
              format: "at-identifier",
              description: "The handle or DID of the repo.",
            },
            collection: {
              type: "string",
              format: "nsid",
              description: "The NSID of the record collection.",
            },
            rkey: {
              type: "string",
              description: "The Record Key.",
              format: "record-key",
            },
            cid: {
              type: "string",
              format: "cid",
              description:
                "The CID of the version of the record. If not specified, then return the most recent version.",
            },
          },
        },
        output: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["uri", "value"],
            properties: {
              uri: {
                type: "string",
                format: "at-uri",
              },
              cid: {
                type: "string",
                format: "cid",
              },
              value: {
                type: "unknown",
              },
            },
          },
        },
        errors: [
          {
            name: "RecordNotFound",
          },
        ],
      },
    },
  },
  ComAtprotoRepoListRecords: {
    lexicon: 1,
    id: "com.atproto.repo.listRecords",
    defs: {
      main: {
        type: "query",
        description:
          "List a range of records in a repository, matching a specific collection. Does not require auth.",
        parameters: {
          type: "params",
          required: ["repo", "collection"],
          properties: {
            repo: {
              type: "string",
              format: "at-identifier",
              description: "The handle or DID of the repo.",
            },
            collection: {
              type: "string",
              format: "nsid",
              description: "The NSID of the record type.",
            },
            limit: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              default: 50,
              description: "The number of records to return.",
            },
            cursor: {
              type: "string",
            },
            reverse: {
              type: "boolean",
              description: "Flag to reverse the order of the returned records.",
            },
          },
        },
        output: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["records"],
            properties: {
              cursor: {
                type: "string",
              },
              records: {
                type: "array",
                items: {
                  type: "ref",
                  ref: "lex:com.atproto.repo.listRecords#record",
                },
              },
            },
          },
        },
      },
      record: {
        type: "object",
        required: ["uri", "cid", "value"],
        properties: {
          uri: {
            type: "string",
            format: "at-uri",
          },
          cid: {
            type: "string",
            format: "cid",
          },
          value: {
            type: "unknown",
          },
        },
      },
    },
  },
  ComAtprotoRepoPutRecord: {
    lexicon: 1,
    id: "com.atproto.repo.putRecord",
    defs: {
      main: {
        type: "procedure",
        description:
          "Write a repository record, creating or updating it as needed. Requires auth, implemented by PDS.",
        input: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["repo", "collection", "rkey", "record"],
            nullable: ["swapRecord"],
            properties: {
              repo: {
                type: "string",
                format: "at-identifier",
                description:
                  "The handle or DID of the repo (aka, current account).",
              },
              collection: {
                type: "string",
                format: "nsid",
                description: "The NSID of the record collection.",
              },
              rkey: {
                type: "string",
                format: "record-key",
                description: "The Record Key.",
                maxLength: 512,
              },
              validate: {
                type: "boolean",
                description:
                  "Can be set to 'false' to skip Lexicon schema validation of record data, 'true' to require it, or leave unset to validate only for known Lexicons.",
              },
              record: {
                type: "unknown",
                description: "The record to write.",
              },
              swapRecord: {
                type: "string",
                format: "cid",
                description:
                  "Compare and swap with the previous record by CID. WARNING: nullable and optional field; may cause problems with golang implementation",
              },
              swapCommit: {
                type: "string",
                format: "cid",
                description:
                  "Compare and swap with the previous commit by CID.",
              },
            },
          },
        },
        output: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["uri", "cid"],
            properties: {
              uri: {
                type: "string",
                format: "at-uri",
              },
              cid: {
                type: "string",
                format: "cid",
              },
              commit: {
                type: "ref",
                ref: "lex:com.atproto.repo.defs#commitMeta",
              },
              validationStatus: {
                type: "string",
                knownValues: ["valid", "unknown"],
              },
            },
          },
        },
        errors: [
          {
            name: "InvalidSwap",
          },
        ],
      },
    },
  },
} as const satisfies Record<string, LexiconDoc>;
export const schemas = Object.values(schemaDict) satisfies LexiconDoc[];
export const lexicons: Lexicons = new Lexicons(schemas);

export function validate<T extends { $type: string }>(
  v: unknown,
  id: string,
  hash: string,
  requiredType: true,
): ValidationResult<T>;
export function validate<T extends { $type?: string }>(
  v: unknown,
  id: string,
  hash: string,
  requiredType?: false,
): ValidationResult<T>;
export function validate(
  v: unknown,
  id: string,
  hash: string,
  requiredType?: boolean,
): ValidationResult {
  return (requiredType ? is$typed : maybe$typed)(v, id, hash)
    ? lexicons.validate(`${id}#${hash}`, v)
    : {
        success: false,
        error: new ValidationError(
          `Must be an object with "${hash === "main" ? id : `${id}#${hash}`}" $type property`,
        ),
      };
}

export const ids = {
  ComAtprotoRepoCreateRecord: "com.atproto.repo.createRecord",
  ComAtprotoRepoDefs: "com.atproto.repo.defs",
  ComAtprotoRepoDeleteRecord: "com.atproto.repo.deleteRecord",
  ComAtprotoRepoDescribeRepo: "com.atproto.repo.describeRepo",
  ComAtprotoRepoGetRecord: "com.atproto.repo.getRecord",
  ComAtprotoRepoListRecords: "com.atproto.repo.listRecords",
  ComAtprotoRepoPutRecord: "com.atproto.repo.putRecord",
} as const;
