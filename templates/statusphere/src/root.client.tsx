"use client";

import { isRouteErrorResponse } from "protoflare/client";
import {
  href,
  Link,
  Links,
  Meta,
  Outlet,
  ScrollRestoration,
  useRouteError,
  type ShouldRevalidateFunction,
} from "react-router";

import { Button } from "~/components/ui/button";

import { logoutAction } from "./root.actions";

import "./root.css";

export function ClientLayout({
  children,
  lastSyncedAt,
  location,
  user,
}: {
  children: React.ReactNode;
  lastSyncedAt: string;
  location: string;
  user?: {
    did: string;
    handle: string;
  };
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Links />
        <Meta />
      </head>
      <body>
        <header>
          <nav>
            <h1>
              <Link to={href("/")}>App Name</Link>
            </h1>
            <ul>
              <li>
                <Link to={href("/about")} className="btn">
                  About
                </Link>
              </li>
              {user ? (
                <li>
                  <form action={logoutAction}>
                    <div>
                      <Button type="submit">Logout</Button>
                    </div>
                  </form>
                </li>
              ) : null}
            </ul>
          </nav>
        </header>
        {children}
        <footer>
          <p>Served from: {location}</p>
          <p>Last sync event: {lastSyncedAt}</p>
          {user ? (
            <p>
              User ID: <code>{user.did}</code>
            </p>
          ) : null}
        </footer>
        <ScrollRestoration />
      </body>
    </html>
  );
}

export default function ClientRoot() {
  return <Outlet />;
}

export function ErrorBoundary() {
  const error = useRouteError();

  let status: number;
  let message: string;

  const errorResponse = isRouteErrorResponse(error);
  if (errorResponse) {
    status = errorResponse.status;
    if (errorResponse.statusText) {
      message = errorResponse.statusText;
    }

    switch (status) {
      case 404:
        message ??= "Page not found.";
        break;
    }
  } else {
    status = 500;
  }

  message ??= "Sorry, an unexpected error has occurred.";

  return (
    <main>
      <section>
        <h1>{status}</h1>
        <p>{message}</p>
      </section>
    </main>
  );
}
