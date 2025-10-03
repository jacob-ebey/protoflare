export type SerializedRequest = {
  body?: ReadableStream<Uint8Array> | null;
  headers: [string, string][];
  method: string;
  url: string;
};

export function serializeRequestWithoutBody(
  request: Request,
): SerializedRequest | Request {
  if (import.meta.env.PROD) return request;

  return {
    headers: Array.from(request.headers),
    method: request.method,
    url: request.url,
  };
}

export function deserializeRequest(
  request: Request | SerializedRequest,
): Request {
  if (import.meta.env.PROD) return request as Request;

  const { body, headers, method, url } = request;

  return new Request(url, {
    body,
    headers,
    method,
  });
}

export type SerializedResponse = {
  body: ReadableStream<Uint8Array> | null;
  headers: [string, string][];
  status: number;
  statusText: string;
};

export function serializeResponse(
  response: Response,
): Response | SerializedResponse {
  if (import.meta.env.PROD) return response;

  return {
    body: response.body,
    headers: Array.from(response.headers),
    status: response.status,
    statusText: response.statusText,
  };
}

export function deserializeResponse(
  response: Response | SerializedResponse,
): Response {
  if (import.meta.env.PROD) return response as Response;

  const { body, headers, status, statusText } = response;

  return new Response(body, {
    headers,
    status,
    statusText,
  });
}
