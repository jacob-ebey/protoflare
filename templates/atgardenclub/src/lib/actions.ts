import { type, type Type } from "arktype";

type ActionErrors<T extends Type<any>> = Partial<
  Record<keyof T["infer"], string>
>;

interface ActionErrorConstructor<T extends Type<any>> {
  new (errors: ActionErrors<T>): ActionError<T>;
}

type FormAction<T extends Type<any>, R> = (
  data: T["infer"],
  ActionError: ActionErrorConstructor<T>,
) => Promise<R>;

export type FormActionResult<T extends Type<any>, R> =
  | {
      errors: undefined;
      data: R;
    }
  | {
      errors: ActionErrors<T>;
      data: undefined;
    };

class ActionError<T extends Type<any>> extends Error implements ActionError<T> {
  errors: ActionErrors<T>;
  constructor(errors: ActionErrors<T>) {
    super("action error");
    this.errors = errors;
  }
}

export async function formAction<T extends Type<any>, R>(
  formData: FormData,
  schema: T,
  action: FormAction<T, R>,
): Promise<FormActionResult<T, R>> {
  const input = Object.fromEntries(formData) as T["infer"];
  const out = schema(input);
  if (out instanceof type.errors) {
    const errors = out.issues.reduce((p, c) => {
      p[c.path.stringify() as keyof T["infer"]] = c.message;
      return p;
    }, {} as ActionErrors<T>);
    return { data: undefined, errors };
  }

  try {
    const data = await action(input, ActionError);
    return { data, errors: undefined };
  } catch (reason) {
    if (reason && typeof reason === "object" && reason instanceof ActionError) {
      return {
        data: undefined,
        errors: reason.errors,
      };
    }
    throw reason;
  }
}
