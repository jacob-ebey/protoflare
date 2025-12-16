// This exists so that we can import and use react-aria-components from server contexts, not just client.
// If they ever ship with a "use client"; directive in the build we can get rid of this.
"use client";

export {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  Text,
  TextArea,
  TextField,
  // @ts-expect-error - no types
} from "npm:react-aria-components";
