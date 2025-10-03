import { AsyncLocalStorage } from "node:async_hooks";

const asyncRequestStorage = new AsyncLocalStorage<Request>();

export function provideRequestContext<T>(request: Request, fn: () => T) {
  return asyncRequestStorage.run(request, fn);
}

export function getRequest() {
  const request = asyncRequestStorage.getStore();
  if (!request) {
    throw new Error("Request context not available");
  }
  return request;
}
