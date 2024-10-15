import {
  TRPC_ERROR_CODES_BY_KEY,
  type TRPC_ERROR_CODE_KEY,
} from "@trpc/server/unstable-core-do-not-import";
import { t } from "elysia";

import { NativeEnum } from "./native-enum";

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && !Array.isArray(value) && typeof value === "object";
}

class UnknownCauseError extends Error {
  [key: string]: unknown;
}
export function getCauseFromUnknown(cause: unknown): Error | undefined {
  if (cause instanceof Error) {
    return cause;
  }

  const type = typeof cause;
  if (type === "undefined" || type === "function" || cause === null) {
    return undefined;
  }

  // Primitive types just get wrapped in an error
  if (type !== "object") {
    return new Error(String(cause));
  }

  // If it's an object, we'll create a synthetic error
  if (isObject(cause)) {
    const err = new UnknownCauseError();
    for (const key in cause) {
      err[key] = cause[key];
    }
    return err;
  }

  return undefined;
}

export function getMErrorFromUnknown(cause: unknown): MError {
  if (cause instanceof MError) {
    return cause;
  }
  if (cause instanceof Error && cause.name === "MError") {
    return cause as MError;
  }

  const mError = new MError({
    code: "INTERNAL_SERVER_ERROR",
    cause,
  });

  if (cause instanceof Error && cause.stack) {
    mError.stack = cause.stack;
  }

  return mError;
}

export class MError extends Error {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore override doesn't work in all environments due to "This member cannot have an 'override' modifier because it is not declared in the base class 'Error'"
  public override readonly cause?: Error;
  public readonly code;

  constructor(opts: {
    message?: string;
    code: TRPC_ERROR_CODE_KEY;
    cause?: unknown;
  }) {
    const cause = getCauseFromUnknown(opts.cause);
    const message = opts.message ?? cause?.message ?? opts.code;

    super(message, { cause });

    this.code = opts.code;
    this.name = "MError";

    if (!this.cause) {
      this.cause = cause;
    }
  }
}

export const ErrorSchema = t.Object({
  code: NativeEnum(
    Object.keys(TRPC_ERROR_CODES_BY_KEY).reduce(
      (obj, key) => ({ ...obj, [key]: key }),
      {},
    ),
  ),
  message: t.String(),
});
