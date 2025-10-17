"use client";

import { isRouteErrorResponse } from "protoflare/client";
import { RouterProvider } from "react-aria-components";
import {
  href,
  Links,
  Meta,
  Outlet,
  ScrollRestoration,
  useHref,
  useNavigate,
  useRouteError,
} from "react-router";

import { Button } from "~/components/ui/button";
import { Link } from "~/components/ui/link";

import { logoutAction } from "./root.actions";

import "./root.css";

export function ClientLayout({
  children,
  location,
  user,
}: {
  children: React.ReactNode;
  location: string;
  user?: {
    did: string;
    handle: string;
  };
}) {
  const navigate = useNavigate();

  return (
    <RouterProvider navigate={navigate} useHref={useHref}>
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
                <Link href={href("/")}>Explorer</Link>
              </h1>
              <ul>
                <li>
                  <Link href={href("/about")} className="btn">
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
            {user ? (
              <p>
                User ID: <code>{user.did}</code>
              </p>
            ) : null}
          </footer>
          <ScrollRestoration />
        </body>
      </html>
    </RouterProvider>
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
