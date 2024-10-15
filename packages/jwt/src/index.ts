import hkdf from "@panva/hkdf";
import {
  EncryptJWT,
  jwtDecrypt,
  jwtVerify,
  SignJWT,
  type JWTPayload,
} from "jose";
import { v4 as uuid } from "uuid";

import { defaultCookies, SessionStore } from "./cookie";

export const getSessionTokenFromCookies = ({
  cookies,
  https,
}: {
  cookies: Record<string, string>;
  https: boolean;
}) => {
  const sessionStore = new SessionStore(
    defaultCookies(https).sessionToken,
    cookies,
  );

  return sessionStore.value;
};

export const createSessionJWT = async ({
  cookies,
  secret,
  https,
}: {
  cookies: Record<string, string>;
  secret: string;
  https: boolean;
}) => {
  const sessionToken = getSessionTokenFromCookies({ cookies, https });

  const jwt = new SignJWT({ sub: sessionToken })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(now() + 60 * 3) // 3 minutes
    .setIssuedAt()
    .setIssuer("https://metrik.app")
    .sign(new TextEncoder().encode(secret));

  return await jwt;
};

export const readSessionJWT = async ({
  jwt,
  secret,
}: {
  jwt: string;
  secret: string;
}) => {
  let sub: string | undefined = undefined;
  try {
    const { payload } = await jwtVerify(jwt, new TextEncoder().encode(secret), {
      algorithms: ["HS256"],
      issuer: "https://metrik.app",
    });

    sub = payload.sub;
  } catch (error) {
    sub = undefined;
  }

  return sub;
};

export const nextAuthDecoder = async <T>({
  token,
  secret,
}: {
  token?: string | undefined;
  secret: string | Buffer;
}): Promise<T | null> => {
  if (!token) {
    return null;
  }
  return (await decode(token, secret as string)) as T;
};

export const decode = async (
  token: string,
  secret: string,
): Promise<JWTPayload> => {
  const key = await getSecret(secret);

  const { payload } = await jwtDecrypt(token, key, {
    clockTolerance: 15,
  });

  return payload;
};

const maxAge = 60 * 60 * 24 * 7; // 7 days
const now = () => (Date.now() / 1000) | 0;

export const sign = async (
  token: JWTPayload,
  secret: string,
): Promise<string> => {
  const jwt = new EncryptJWT(token)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(now() + maxAge)
    .setJti(uuid())
    .encrypt(await getSecret(secret));

  return await jwt;
};

export const getSecret = async (baseSecret: string) => {
  return await hkdf(
    "sha256",
    baseSecret,
    "",
    "Metrik Session Encryption Key",
    32,
  );
};
