"use client";

import { useActionState, useId } from "react";

import { Button } from "~/components/ui/button";
import {
  FieldError,
  Form,
  Input,
  InputField,
  Label,
} from "~/components/ui/form";
import type { XyzStatusphereStatus } from "~/lexicons";

import { loginAction, setStatusAction } from "./home.actions";

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

export function StatusForm({
  status,
}: {
  status?: XyzStatusphereStatus.Record;
}) {
  const [state, action, pending] = useActionState(setStatusAction, undefined);

  const { error } = state || {};

  return (
    <Form
      action={action}
      validationErrors={!pending && error ? { status: error } : undefined}
      onSubmit={(event) => {
        if (pending) event.preventDefault();
      }}
    >
      {status ? (
        <p>
          {status.status} updated at {status.createdAt}
        </p>
      ) : (
        <p>No status set</p>
      )}

      <InputField isRequired type="text" name="status">
        <Label>Status</Label>
        <Input autoCapitalize="off" maxLength={2} />

        <FieldError />
      </InputField>
      <div>
        <Button type="submit" isPending={pending}>
          {pending ? "Setting..." : "Set Status"}
        </Button>
      </div>
    </Form>
  );
}
