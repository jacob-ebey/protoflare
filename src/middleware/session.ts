import { env } from "cloudflare:workers";
import { AsyncLocalStorage } from "node:async_hooks";
import {
  createCookieSessionStorage,
  type SessionStorage,
  type MiddlewareFunction,
  type Session,
} from "react-router";

type SessionData = {
  user?: {
    did: string;
    handle: string;
  };
};

type SessionContext = {
  session: Session<SessionData, SessionData>;
  sessionStorage: SessionStorage<SessionData, SessionData>;
};

const asyncSessionStorage = new AsyncLocalStorage<SessionContext>();

export const sessionMiddleware: MiddlewareFunction = async (
  { request },
  next
) => {
  const SESSION_SECRET = env.SESSION_SECRET;
  if (!SESSION_SECRET) {
    throw new Error("SESSION_SECRET must be set");
  }

  const sessionStorage = createCookieSessionStorage({
    cookie: {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secrets: [SESSION_SECRET],
    },
  });

  const ctx: SessionContext = {
    session: await sessionStorage.getSession(request.headers.get("Cookie")),
    sessionStorage,
  };
  const response = await asyncSessionStorage.run(ctx, next);
  if (!(response instanceof Response)) {
    return response;
  }
  const cookie = await sessionStorage.commitSession(ctx.session);
  const headers = new Headers(response.headers);
  headers.append("Set-Cookie", cookie);

  return new Response(response.body, {
    cf: response.cf,
    headers,
    status: response.status,
    statusText: response.statusText,
    webSocket: response.webSocket,
  });
};

export function getSession(): Session<SessionData, SessionData> | null {
  const ctx = asyncSessionStorage.getStore();
  if (!ctx) {
    return null;
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
