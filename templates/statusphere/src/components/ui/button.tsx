"use client";

import { Button as BaseButton } from "react-aria-components";

import "./button.css";

export function Button(props: React.ComponentProps<typeof BaseButton>) {
  return <BaseButton {...props} />;
}
