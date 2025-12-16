import { type, type Type } from "arktype";
import { startTransition, useCallback, useState } from "react";
import { Form as AriaForm } from "react-aria-components";

import { useHydrated } from "./hooks";

type FormProps = {
  action: (formData: FormData) => void | Promise<void>;
  children?: React.ReactNode;
  isPending?: boolean;
  ref?: React.ComponentProps<typeof AriaForm>["ref"];
  schema: Type<any>;
  validationErrors?: Record<string, string>;
};

export function Form({
  action,
  children,
  isPending,
  ref,
  schema,
  validationErrors,
}: FormProps) {
  const hydrated = useHydrated();

  const [defaultErrors, setDefaultErrors] = useState(validationErrors);
  const [errors, setErrors] = useState(defaultErrors);
  if (validationErrors !== defaultErrors) {
    setDefaultErrors(validationErrors);
    setErrors(validationErrors);
  }

  const onSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      if (isPending) {
        event.preventDefault();
        return;
      }

      const formData = new FormData(
        event.currentTarget,
        (event.nativeEvent as SubmitEvent).submitter,
      );
      const obj = Object.fromEntries(formData);
      const out = schema(obj);
      if (out instanceof type.errors) {
        const errors = out.issues.reduce(
          (p, c) => {
            p[c.path.stringify()] = c.message;
            return p;
          },
          {} as Record<string, string>,
        );
        setErrors(errors);
        event.preventDefault();
      } else {
        setErrors(undefined);
        startTransition(() => action(formData));
        event.preventDefault();
      }
    },
    [action, schema],
  );

  const formProps = hydrated ? { onSubmit } : { action };

  return (
    <AriaForm {...formProps} ref={ref} validationErrors={errors}>
      {children}
    </AriaForm>
  );
}
