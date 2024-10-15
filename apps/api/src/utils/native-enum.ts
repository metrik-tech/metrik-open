import {
  Kind,
  TypeRegistry,
  Union,
  type SchemaOptions,
  type TLiteral,
  type TSchema,
} from "@sinclair/typebox";

export type RecordStringString = Record<string, string>;

export interface TNativeEnum<
  T extends RecordStringString = Record<string, string>,
> extends TSchema {
  [Kind]: "NativeEnum";
  static: T[keyof T];
  enum: (keyof T)[];
}

export function NativeEnum<T extends RecordStringString>(
  values: T,
  options: SchemaOptions = {},
) {
  function UnionEnumCheck(
    schema: TNativeEnum<RecordStringString>,
    value: unknown,
  ) {
    return typeof value === "string" && schema.enum.includes(value);
  }
  if (!TypeRegistry.Has("NativeEnum"))
    TypeRegistry.Set("NativeEnum", UnionEnumCheck);

  return {
    ...options,
    [Kind]: "NativeEnum",
    enum: Object.keys(values),
  } as TNativeEnum<T>;
}
