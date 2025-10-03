"use client";

import {
  FieldError,
  Form,
  Input,
  Label,
  Text,
  TextField,
} from "react-aria-components";

import "./form.css";

export { FieldError, Form, Input, Label };

export type InputFieldProps = React.ComponentProps<typeof TextField>;

export function InputField(props: InputFieldProps) {
  return <TextField {...props} />;
}

export function InputDescription({ children }: { children: React.ReactNode }) {
  return <Text slot="description">{children}</Text>;
}
