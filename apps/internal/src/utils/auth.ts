import { type NextFetchEvent } from "next/server";
import { decode, verify } from "@tsndr/cloudflare-worker-jwt";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { type Logger } from "next-axiom";

export async function verifyJwt(token: string, logger: Logger) {
  const valid = await jwtVerify(
    token,
    createRemoteJWKSet(
      new URL("https://metrikrbx.cloudflareaccess.com/cdn-cgi/access/certs"),
    ),
    {
      audience:
        "447e1c9b76c3b8b8c1701bb318eea076e530f8e41b70b8da21758721da7f04e0", // TODO: put in a secret
    },
  )
    .then((res) => {
      logger.info("Session started", { payload: res.payload });

      return true;
    })
    .catch(() => false);

  if (!valid) {
    return false;
  }

  return true;
}
