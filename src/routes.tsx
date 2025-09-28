import {
  Outlet,
  type unstable_RSCRouteConfig as RSCRouteConfig,
} from "react-router";

export const routes = [
  {
    id: "root",
    Layout({ children }) {
      return (
        <html lang="en">
          <head>
            <meta charSet="utf-8" />
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1"
            />
          </head>
          <body>{children}</body>
        </html>
      );
    },
    Component: Outlet,
    children: [
      {
        id: "home",
        index: true,
        lazy: () => import("./routes/home"),
      },
    ],
  },
] satisfies RSCRouteConfig;
