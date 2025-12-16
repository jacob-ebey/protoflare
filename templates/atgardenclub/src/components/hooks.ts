import { useSyncExternalStore } from "react";

function snoop() {
  return () => {};
}

export function useHydrated() {
  return useSyncExternalStore(
    snoop,
    () => true,
    () => false,
  );
}
