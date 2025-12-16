import { href } from "react-router";

export function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  function map(href: string) {
    const location = new URL(href, url.origin).href;
    return `<url><loc>${location}</loc></url>`;
  }

  const locations = [
    map(href("/")),
    map(href("/contribute")),
    map(href("/guidelines")),
    map(href("/og-styles")),
    map(href("/resources")),
    map(href("/styles")),
    map(href("/")),
  ];

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${locations.join("")}</urlset>`,
    {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    },
  );
}
