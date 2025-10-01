import { AsyncLocalStorage } from "node:async_hooks";

const asyncCloudflareStorage = new AsyncLocalStorage<
  IncomingRequestCfProperties<unknown> | undefined
>();

export function provideCloudflareContext<T>(
  cf: IncomingRequestCfProperties<unknown> | undefined,
  fn: () => T
) {
  return asyncCloudflareStorage.run(cf, fn);
}

export function getCloudflareContext() {
  return asyncCloudflareStorage.getStore();
}
