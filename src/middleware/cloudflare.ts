import { AsyncLocalStorage } from "node:async_hooks";

const asyncCloudflareStorage = new AsyncLocalStorage<
  CfProperties<unknown> | undefined
>();

export function provideCloudflareContext<T>(
  cf: CfProperties<unknown> | undefined,
  fn: () => T,
) {
  return asyncCloudflareStorage.run(cf, fn);
}

export function getCloudflareContext() {
  return asyncCloudflareStorage.getStore();
}
