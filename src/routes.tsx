import {
  data,
  type unstable_RSCRouteConfig as RSCRouteConfig,
} from "react-router";

import {
  oauthCallbackPathname,
  oauthClientMeatadataPathname,
} from "./middleware/atproto";

declare module "react-router" {
  interface Register {
    pages: {
      "/": { params: {} };
      "/about": { params: {} };
    };
  }
}

export const routes = [
  {
    id: "root",
    lazy: () => import("./root"),
    children: [
      {
        id: "home",
        index: true,
        lazy: () => import("./routes/home"),
      },
      {
        id: "about",
        path: "/about",
        lazy: () => import("./routes/about"),
      },
      {
        id: "oauth-callback",
        path: oauthCallbackPathname,
        lazy: () => import("./routes/oauth-callback"),
      },
      {
        id: "oauth-client-metadata",
        path: oauthClientMeatadataPathname,
        lazy: () => import("./routes/oauth-client-metadata"),
      },
      {
        id: "not-fount",
        path: "*",
        loader: () => data(null, 404),
        Component() {
          return (
            <main>
              <h1>404 Not Found</h1>
              <p>The page you are looking for does not exist.</p>
            </main>
          );
        },
      },
    ],
  },
] satisfies RSCRouteConfig;
