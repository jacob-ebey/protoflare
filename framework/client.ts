import {
  isRouteErrorResponse as baseIsRouteErrorResponse,
  type ErrorResponse,
} from "react-router";

import { ERROR_BOUNDARY_ERROR, ERROR_DIGEST_BASE } from "./shared";

export function isRouteErrorResponse(error: unknown): false | ErrorResponse {
  if (baseIsRouteErrorResponse(error)) {
    return error;
  } else if (
    error &&
    typeof error === "object" &&
    "digest" in error &&
    typeof error.digest === "string" &&
    error.digest.startsWith(`${ERROR_DIGEST_BASE}[`) &&
    error.digest.endsWith("]")
  ) {
    const [type, ...props] = JSON.parse(
      error.digest.slice(ERROR_DIGEST_BASE.length),
    );

    switch (type) {
      case ERROR_BOUNDARY_ERROR: {
        const [status, statusText, data] = props;
        return {
          status,
          statusText,
          data,
        };
      }
    }
  }

  return false;
}
