"use client";

import { useActionState } from "react";

import { Button } from "~/components/ui/button";
import {
  FieldError,
  Form,
  Input,
  InputField,
  Label,
} from "~/components/ui/form";

import { loginAction } from "./home.actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, undefined);

  const { error } = state || {};

  return (
    <section>
      <h1>Login</h1>
      <Form
        action={action}
        validationErrors={!pending && error ? { handle: error } : undefined}
        onSubmit={(event) => {
          if (pending) event.preventDefault();
        }}
      >
        <InputField isRequired type="text" name="handle">
          <Label>Handle</Label>
          <Input autoCapitalize="off" placeholder="user.bsky.social" />
          <FieldError />
        </InputField>
        <div>
          <Button type="submit" isPending={pending}>
            {pending ? "Logging in..." : "Login"}
          </Button>
        </div>
      </Form>
    </section>
  );
}
