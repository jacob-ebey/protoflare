"use client";

import {
  href,
  Link,
  Links,
  Meta,
  Outlet,
  ScrollRestoration,
  type ShouldRevalidateFunction,
} from "react-router";

import { Button } from "~/components/ui/button";

import { logoutAction } from "./root.actions";

import "./root.css";
import { Suspense } from "react";

export const shouldRevalidate: ShouldRevalidateFunction = ({
  formMethod,
  currentUrl,
  nextUrl,
}) => {
  // revalidate when a mutation is performed e.g add to cart, login...
  if (formMethod && formMethod !== "GET") {
    return true;
  }

  // revalidate when manually revalidating via useRevalidator
  if (currentUrl.toString() === nextUrl.toString()) {
    return true;
  }

  return false;
};

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
        <footer>Served from {location}</footer>
        <ScrollRestoration />
      </body>
    </html>
  );
}

export function ClientRoot() {
  return <Outlet />;
}

export function ClientErrorBoundary() {
  return (
    <main>
      <h1>Application Error</h1>
      <p>Sorry, an unexpected error has occurred.</p>
      <p>
        Please try refreshing the page, or{" "}
        <a href="mailto:support@example.com">contact support</a>.
      </p>
    </main>
  );
}
