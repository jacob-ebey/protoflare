"use client";

import { useTransition } from "react";
import { href, Link, useNavigate, useRevalidator } from "react-router";

export function RefreshButton({ cursor }: { cursor?: string | null }) {
  const [revalidating, startRevalidation] = useTransition();
  const { revalidate } = useRevalidator();

  return (
    <Link
      to={`${href("/styles")}${cursor ? `?${new URLSearchParams({ cursor })}` : ""}`}
      onClick={(event) => {
        event.preventDefault();
        if (!revalidating) {
          startRevalidation(() => revalidate());
        }
      }}
    >
      {revalidating ? "Refreshing Styles..." : "Refresh Styles"}
    </Link>
  );
}

export function NextPageButton({ cursor }: { cursor: string }) {
  const [loading, startLoading] = useTransition();
  const navigate = useNavigate();

  const to = `${href("/styles")}?${new URLSearchParams({ cursor })}`;

  return (
    <Link
      to={to}
      onClick={(event) => {
        event.preventDefault();
        if (!loading) {
          startLoading(() => navigate(to));
        }
      }}
    >
      {loading ? "Loading Next Page..." : "Next Page"}
    </Link>
  );
}
