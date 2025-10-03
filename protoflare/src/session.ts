import { AsyncLocalStorage } from "node:async_hooks";
import {
  createCookieSessionStorage,
  type SessionStorage,
  type Session,
} from "react-router";

declare global {
  namespace ProtoflareServer {
    export interface SessionData {
      user?: {
        did: string;
        handle: string;
      };
    }
  }
}

type SessionContext = {
  session: Session<ProtoflareServer.SessionData, ProtoflareServer.SessionData>;
  sessionStorage: SessionStorage<
    ProtoflareServer.SessionData,
    ProtoflareServer.SessionData
  >;
};

const asyncSessionStorage = new AsyncLocalStorage<SessionContext>();

export const provideSessionContext = async (
  { request, secrets }: { request: Request; secrets: string[] },
  next: () => Promise<Response> | Response,
): Promise<Response> => {
  if (!secrets || !secrets.length || !secrets[0]) {
    throw new Error("session secret not configured");
  }

  const sessionStorage = createCookieSessionStorage({
    cookie: {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secrets,
    },
  });

  const ctx: SessionContext = {
    session: await sessionStorage.getSession(request.headers.get("Cookie")),
    sessionStorage,
  };
  const snapshot = JSON.stringify(ctx.session.data);
  const response = await asyncSessionStorage.run(ctx, next);
  if (!(response instanceof Response)) {
    return response;
  }
  const cookie = await sessionStorage.commitSession(ctx.session);
  const headers = new Headers(response.headers);
  headers.append("Set-Cookie", cookie);

  if (snapshot === JSON.stringify(ctx.session.data)) {
    return response;
  }

  return new Response(response.body, {
    cf: response.cf,
    headers,
    status: response.status,
    statusText: response.statusText,
    webSocket: response.webSocket,
  });
};

export function getSession(): Session<
  ProtoflareServer.SessionData,
  ProtoflareServer.SessionData
> {
  const ctx = asyncSessionStorage.getStore();
  if (!ctx) {
    throw new Error("No session context");
  }
  return ctx.session;
}

export async function destroySession(): Promise<void> {
  const ctx = asyncSessionStorage.getStore();
  if (!ctx) {
    throw new Error("No session context");
  }
  ctx.session = await ctx.sessionStorage.getSession();
}
