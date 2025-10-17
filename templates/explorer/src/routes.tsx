import { type unstable_RSCRouteConfig as RSCRouteConfig } from "react-router";

export const oauthCallbackPathname = "/oauth/callback";
export const oauthClientMeatadataPathname = "/oauth/client-metadata.json";

declare module "react-router" {
  interface Register {
    pages: {
      "/": { params: {} };
      "/about": { params: {} };
      "/at://:repo": {
        params: { repo: string };
      };
      "/at://:repo/:collection": {
        params: { collection: string; repo: string };
      };
    };
  }
}

export const routes = [
  {
    id: "root",
    path: "",
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
        id: "repo",
        path: "/at://:repo",
        lazy: () => import("./routes/repo"),
      },
      {
        id: "collection",
        path: "/at://:repo/:collection",
        lazy: () => import("./routes/collection"),
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
    ],
  },
] satisfies RSCRouteConfig;
