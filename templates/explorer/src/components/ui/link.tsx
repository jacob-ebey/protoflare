"use client";

import { Link as BaseLink } from "react-aria-components";

export function Link({
  children,
  ...props
}: React.ComponentProps<typeof BaseLink>) {
  return <BaseLink {...props}>{children}</BaseLink>;
}
