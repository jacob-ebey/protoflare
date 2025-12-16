import { isValidHandle } from "@atproto/syntax";
import { type } from "arktype";

const ATProtoHandle = type("string > 0").narrow((data, ctx) => {
  if (isValidHandle(data)) return true;
  return ctx.reject({
    actual: "",
    expected: "valid handle",
  });
});

export const LoginSchema = type({
  handle: ATProtoHandle,
});

export const StyleStageSubmissionSchema = type({
  title: "0 < string <= 40",
  styles: "string > 0",
});
