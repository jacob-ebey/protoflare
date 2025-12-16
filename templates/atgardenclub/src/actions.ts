"use server";

import { env } from "cloudflare:workers";

import { TID } from "@atproto/common-web";
import autoprefixer from "autoprefixer";
import postcss from "postcss";
import {
  destroySession,
  getAtprotoClient,
  getSession,
  revalidateTag,
} from "protoflare/server";
import { href, redirectDocument } from "react-router";

import { LoginSchema, StyleStageSubmissionSchema } from "#forms";
import * as StyleStage from "#lexicons/types/club/atgarden/stylestage";
import { formAction, type FormActionResult } from "#lib/actions";

const sql = String.raw;

export async function loginAction(
  _: unknown,
  formData: FormData,
): Promise<FormActionResult<typeof LoginSchema, void> | undefined> {
  return formAction(formData, LoginSchema, async ({ handle }, ActionError) => {
    const client = getAtprotoClient();
    let redirectURL: URL;
    try {
      redirectURL = await client.authorize(handle);
    } catch (reason) {
      console.error(reason);
      throw new ActionError({
        handle: "failed to authorize",
      });
    }
    throw Response.redirect(redirectURL.href);
  });
}

export async function logoutAction() {
  const client = getAtprotoClient();
  const session = getSession();
  const user = session.get("user");

  await Promise.allSettled([user && client.logout(user.did), destroySession()]);

  redirectDocument(href("/"));
}

export async function submitStyleAction(_: unknown, formData: FormData) {
  return formAction(
    formData,
    StyleStageSubmissionSchema,
    async ({ styles, title }, ActionError) => {
      const session = getSession();
      const user = session?.get("user");
      if (!user) {
        throw new Response(href("/contribute"));
      }

      const client = getAtprotoClient();

      let { css } = await postcss([autoprefixer()])
        .process(styles)
        .catch((reason) => {
          throw new ActionError({
            styles:
              "failed to process styles with postcss, you likely have a syntax error",
          });
        });
      css = css.trim();

      if (!css) {
        throw new ActionError({
          styles: "styles must be non-empty",
        });
      }

      const createdAt = new Date().toISOString();
      const valid = StyleStage.validateRecord({
        $type: "club.atgarden.stylestage",
        createdAt,
        title,
        styles: css,
      });

      if (!valid.success) {
        throw new ActionError({
          title: valid.error.message,
        });
      }

      const rkey = TID.nextStr();
      const record = await client.xrpc.club.atgarden.stylestage.create(
        { repo: user.did, rkey, validate: false },
        valid.value,
      );
      if (!record.uri) {
        throw new ActionError({
          title: "failed to create atproto record",
        });
      }

      const res = await env.DB.prepare(
        sql`
          INSERT INTO stylestage(
            uri, authorDid, title, styles, createdAt, indexedAt
          ) VALUES (?, ?, ?, ?, ?, ?)
        `,
      )
        .bind(
          record.uri,
          user.did,
          valid.value.title,
          valid.value.styles,
          valid.value.createdAt,
          valid.value.createdAt,
        )
        .run();

      if (res.meta.rows_written) {
        throw redirectDocument(
          href("/styles/:userDidOrHandle/:rkey", {
            rkey,
            userDidOrHandle: user.handle,
          }),
        );
      }

      await revalidateTag("stylestage");

      return {
        success: true,
        message:
          "The record has been created in your repository but we have failed to index it on our end. It should make it's way here through the JetStream. Be patient, there is no need to re-submit at the moment.",
      };
    },
  );
}
