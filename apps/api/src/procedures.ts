import { Context } from "elysia";
import { getIP } from "elysia-ip";

import { IP_LOCK_OVERRIDE_USERS } from "./context";
import { MError } from "./utils/error";
import { checker } from "./utils/roblox-ranges";

export const robloxOnly = (ctx: Context) => {
  if (ctx.request.url.startsWith("http://localhost")) {
    return;
  }

  const ip = getIP(ctx.request.headers);

  if (!ip || !checker(ip)) {
    throw new MError({
      message:
        "This endpoint can only be accessed from within Roblox's IP ranges at this time. Please contact Metrik support if you believe this is a mistake.",
      code: "UNAUTHORIZED",
    });
  }

  return;
};

export const robloxRestricted = (
  headers: Headers,
  userId: string,
  url: string,
) => {
  // console.log({
  //   headers,
  //   userId,
  //   url,
  //   allowed: IP_LOCK_OVERRIDE_USERS.has(userId),
  // });
  if (
    url.startsWith("http://localhost") ||
    IP_LOCK_OVERRIDE_USERS.has(userId)
  ) {
    return;
  }

  const ip = getIP(headers);

  if (!ip || !checker(ip)) {
    throw new MError({
      message:
        "This endpoint can only be accessed from within Roblox's IP ranges at this time. Please contact Metrik support if you believe this is a mistake.",
      code: "UNAUTHORIZED",
    });
  }

  return;
};
