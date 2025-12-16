"use client";

import { useActionState, useCallback, useRef } from "react";
import {
  Button,
  FieldError,
  Input,
  Label,
  Text,
  TextArea,
  TextField,
} from "react-aria-components";

import { loginAction, submitStyleAction } from "#actions";
import { Form } from "#components/form";
import { useHydrated } from "#components/hooks";
import { LoginSchema, StyleStageSubmissionSchema } from "#forms";

export function LoginForm() {
  const [result, action, pending] = useActionState(loginAction, undefined);

  return (
    <Form
      action={action}
      isPending={pending}
      schema={LoginSchema}
      validationErrors={result?.errors}
    >
      <fieldset>
        <legend>Login</legend>

        <TextField name="handle" isRequired>
          <Label>Handle</Label>
          <Input type="text" placeholder="Your ATProto handle" />
          <Text slot="description">
            Usually your domian or Bluesky handle. (example.com,
            example.bsky.social)
          </Text>
          <FieldError />
        </TextField>

        <Button type="submit">{pending ? "Redirecting" : "Login"}</Button>
      </fieldset>
    </Form>
  );
}

export function ContributeForm() {
  const hydrated = useHydrated();
  const formRef = useRef<HTMLFormElement>(null);

  const enhancedSubmitStyleAction = useCallback(
    async (_: unknown, formData: FormData) => {
      const result = await submitStyleAction(undefined as never, formData);

      if (result?.data?.success) {
        formRef.current?.reset();
        formRef.current?.querySelector("input")?.focus();
      }

      return result;
    },
    [],
  );

  const [result, action, pending] = useActionState(
    hydrated ? enhancedSubmitStyleAction : submitStyleAction,
    undefined,
  );

  return (
    <Form
      action={action}
      isPending={pending}
      ref={formRef}
      schema={StyleStageSubmissionSchema}
      validationErrors={result?.errors}
    >
      <fieldset>
        <legend>Style Submission</legend>

        <TextField name="title" isRequired>
          <Label>Title</Label>
          <Input type="text" maxLength={40} placeholder="My Awesome Style" />
          <Text slot="description">
            Give your stylesheet a memorable name (max 40 characters)
          </Text>
          <FieldError />
        </TextField>

        <TextField name="styles" isRequired>
          <Label>CSS Styles</Label>
          <TextArea
            rows={20}
            placeholder={`/* Your CSS here */\nbody {\n  font-family: system-ui, sans-serif;\n}`}
          />
          <Text slot="description">
            Paste your complete CSS stylesheet. All asset links must be absolute
            URLs.
          </Text>
          <FieldError />
        </TextField>

        <Button type="submit">
          {pending ? "Processing Stylesheet" : "Submit Stylesheet"}
        </Button>

        {result?.data?.message ? <p>{result.data.message}</p> : null}
      </fieldset>
    </Form>
  );
}
