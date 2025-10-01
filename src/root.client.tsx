"use client";

import {
  href,
  isRouteErrorResponse,
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
  );
}

export function ClientRoot() {
  return <Outlet />;
}

export function ClientErrorBoundary() {
  const error = useRouteError();

  let message = "Unknown Error";
  let details = "Sorry, an unexpected error has occurred.";

  if (isRouteErrorResponse(error)) {
    message = `${error.status}: Application Error`;

    switch (error.status) {
      case 404:
        message = "404: Not Found";
        details = "Sorry, the page you requested could not be found.";
        break;
    }
  }

  return (
    <main>
      <section>
        <h1>{message}</h1>
        <p>{details}</p>
      </section>
    </main>
  );
}
