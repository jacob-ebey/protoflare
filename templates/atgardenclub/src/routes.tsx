import { type unstable_RSCRouteConfig as RSCRouteConfig } from "react-router";

export const oauthCallbackPathname = "/oauth/callback";
export const oauthClientMeatadataPathname = "/oauth/client-metadata.json";

declare module "react-router" {
  interface Register {
    pages: {
      "/": { params: {} };
      "/styles": { params: {} };
      "/og-styles": { params: {} };
      "/og-styles/:id": { params: { id: string } };
      "/styles/:userDidOrHandle": {
        params: { userDidOrHandle: string };
      };
      "/styles/:userDidOrHandle/:rkey": {
        params: { userDidOrHandle: string; rkey: string };
      };
      "/styles/:userDidOrHandle/:rkey/styles.css": {
        params: { userDidOrHandle: string; rkey: string };
      };
      "/contribute": { params: {} };
      "/resources": { params: {} };
      "/guidelines": { params: {} };
      "/feed": { params: {} };
      "/subscribe": { params: {} };
      "/sitemap.xml": { params: {} };
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
        lazy: () => import("./routes/stylestage"),
      },
      {
        id: "styles",
        path: "styles",
        lazy: () => import("./routes/styles"),
      },
      {
        id: "styles-user",
        path: "styles/:userDidOrHandle",
        lazy: () => import("./routes/styles-user"),
      },
      {
        id: "style-user",
        path: "styles/:userDidOrHandle/:rkey",
        lazy: () => import("./routes/stylestage"),
      },

      {
        id: "og-styles",
        path: "og-styles",
        lazy: () => import("./routes/og-styles"),
      },
      {
        id: "og-style",
        path: "og-styles/:id",
        lazy: () => import("./routes/og-style"),
      },
      {
        id: "resources",
        path: "resources",
        lazy: () => import("./routes/resources"),
      },
      {
        id: "guidelines",
        path: "guidelines",
        lazy: () => import("./routes/guidelines"),
      },
      {
        id: "contribute",
        path: "contribute",
        lazy: () => import("./routes/contribute"),
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
  {
    id: "style-download",
    path: "styles/:userDidOrHandle/:rkey/styles.css",
    lazy: () => import("./routes/style-download"),
  },
  {
    id: "sitemap",
    path: "sitemap.xml",
    lazy: () => import("./routes/sitemap"),
  },
] as RSCRouteConfig;
