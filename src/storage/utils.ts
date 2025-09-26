import type { Un$Typed } from "../lexicons/util";

type Primitive = null | undefined | string | number | boolean | symbol | bigint;

type _SimplifyRecord<T> = T extends object
  ? {
      [K in keyof T as T[K] extends Primitive
        ? K
        : K extends object
          ? K
          : never]: _SimplifyRecord<T[K]>;
    } & {}
  : T;

export type SimplifyRecord<T extends { $type?: string | undefined }> =
  _SimplifyRecord<Un$Typed<T>> & {};
