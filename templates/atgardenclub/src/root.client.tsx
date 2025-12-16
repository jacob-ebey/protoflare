"use client";

import {
  Links,
  Meta,
  Outlet,
  isRouteErrorResponse,
  useRouteError,
} from "react-router";

import { Main, Shell } from "#components/layout";
import { defaultStyle } from "#og-styles";

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
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/nano-bananna-favicon.png" />
        <Links />
        <Meta />
      </head>
      <body className="page">{children}</body>
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

  if (isRouteErrorResponse(error)) {
    status = error.status;
    if (error.statusText) {
      message = error.statusText;
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
    <>
      <title>Oops | AT Garden Club</title>
      <meta
        name="description"
        content="Something went wrong. We encountered an error while loading this page."
      />
      <link
        rel="stylesheet"
        href={`https://stylestage.dev/styles/css/${defaultStyle.id}.css`}
      />

      <Shell
        title="AT Garden Club"
        description="A CSS showcase styled by the AT Proto community"
      >
        <Main>
          <article>
            <section className="container">
              <p>{status}</p>
              <p>{message}</p>
            </section>
          </article>
        </Main>
      </Shell>
    </>
  );
}
