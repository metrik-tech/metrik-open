import type {
  GetServerSidePropsContext,
  NextApiRequest,
  NextApiResponse,
} from "next/types";
import { getAll } from "@vercel/edge-config";
import { set, subDays } from "date-fns";
import NextAuth, { type DefaultSession, type Session } from "next-auth";
import { Logger } from "next-axiom";

import { prisma } from "@metrik/db/edge";
import { june } from "@metrik/june";

import { env } from "@/env.mjs";
import { log } from "@/utils/log";
import { PrismaAdapter } from "./adapter";
import { getConfig, getEarlyAccess } from "./config";
import stripe from "./stripe";

const randomHex = (bytes = 32) =>
  [...crypto.getRandomValues(new Uint8Array(bytes))]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("");

async function hmac(secret: string, message: string) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msgData = encoder.encode(message);

  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", key, msgData);
  const hashArray = Array.from(new Uint8Array(signature)); // convert buffer to byte array
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(""); // convert bytes to hex string

  return hashHex;
}

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's postal address. */
      id: string;
      robloxId: number | string;
      lilyToken: string;
      onboarded: boolean;
      // intercomHash: string;
    } & DefaultSession["user"];
  }

  interface Profile {
    jti: string;
    created_at: number;
    nbf: number;

    exp: number;
    iat: number;
    iss: string;
    aud: string;
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks,
 * etc.
 *
 * @see https://next-auth.js.org/configuration/options
 **/
export const {
  handlers: { GET, POST },
  auth,
} = NextAuth({
  pages: {
    newUser: "/onboarding",
    signOut: "/auth/signout",
    signIn: "/auth/login",
    error: "/auth/login",
  },
  session: {
    strategy: "database",
    generateSessionToken() {
      return randomHex(32);
    },
  },
  // jwt: {
  //   encode: async ({ secret, token }) => {
  //     return await sign(token ?? {}, secret as string);
  //   },

  //   decode: nextAuthDecoder<JWT>,
  // },

  adapter: PrismaAdapter(prisma),
  events: {
    signIn: async (message) => {
      if (message.profile?.preferred_username) {
        // const earlyAccess = await getEarlyAccess();

        // if (
        //   message.profile.sub &&
        //   !earlyAccess.includes(Number(message.profile.sub))
        // ) {
        //   // @ts-expect-error: idk
        //   if (!message.user.robloxId) {
        //     await prisma.user.update({
        //       where: {
        //         id: message.user.id,
        //       },
        //       data: {
        //         robloxId: message.profile.sub,
        //       },
        //     });
        //   }
        //   return;
        // }

        if (
          message.profile.sub &&
          message.user.id &&
          message.profile.preferred_username
        ) {
          //@ts-expect-error: idk
          const existingCustomer = !!message.user.stripeCustomerId;

          if (!existingCustomer) {
            const customer = await stripe.customers.create({
              name: message.profile.preferred_username,
              metadata: {
                "Roblox User ID": message.profile.sub,
                "Metrik User ID": message.user.id,
              },
            });

            await prisma.user.update({
              where: {
                id: message.user.id,
              },
              data: {
                name: message.profile.preferred_username,
                stripeCustomerId: customer.id,
                lastLogin: new Date(),
                robloxId: message.profile.sub,
              },
            });
          } else {
            await prisma.user.update({
              where: {
                id: message.user.id,
              },
              data: {
                name: message.profile.preferred_username,
                lastLogin: new Date(),
                robloxId: message.profile.sub,
              },
            });
          }
        }
      } else {
        await prisma.user.update({
          where: {
            id: message.user.id,
          },
          data: {
            name: message.profile?.preferred_username,
            lastLogin: new Date(),
          },
        });
      }
      return;
    },
    // session: async (message) => {
    //   const logger = new Logger({ source: "auth" });

    //   console.log("session", message);

    //   if (!("session" in message)) return;

    //   logger.info("Session", {
    //     username: message.session.user.name,
    //     robloxId: message.session.user.robloxId,
    //     id: message.session.user.id,
    //   });

    //   await logger.flush();

    //   return;
    // },
  },
  callbacks: {
    async signIn({ profile, user }) {
      const config = await getConfig();
      const logger = new Logger({ source: "auth" });

      if (
        subDays(new Date(), 30) < new Date((profile?.created_at ?? 0) * 1000)
      ) {
        return `/auth/too-new?user=${profile?.preferred_username ?? ""}`;
      }

      // if (config.earlyAccess.includes(Number(profile?.sub))) {
      //   june.identify({
      //     userId: user.id!,
      //     traits: {
      //       robloxId: profile?.sub,
      //       name: user.name,
      //       avatar: `https://thumbs.metrik.app/headshot/${profile?.sub}`,
      //     },
      //   });
      //   return true;
      // }

      if (config.earlyAccess.includes(Number(profile?.sub))) {
        logger.info("User signed in", {
          username: profile?.preferred_username ?? "",
          robloxId: profile?.sub ?? "",
          id: user.id!,
        });
        await logger.flush();
        return true;
      }

      logger.info("User failed to sign in", {
        username: profile?.preferred_username ?? "",
        robloxId: profile?.sub ?? "",
        id: user.id!,
      });

      await Promise.all([
        logger.flush(),
        log({
          message: ":tada: New user joined waitlist",
          data: [
            {
              name: "Username",
              value: profile?.preferred_username ?? "",
            },
            {
              name: "Roblox ID",
              value: profile?.sub ?? "",
            },
            {
              name: "Profile",
              value: `https://www.roblox.com/users/${profile?.sub}/profile`,
            },
            {
              name: "Timestamp",
              value: `<t:${Math.round(Date.now() / 1000)}:F>`,
            },
          ],
        }),
      ]);

      return true;
    },

    async session(opts) {
      if (!("user" in opts))
        throw "unreachable with session strategy (headshot)";

      const user = await prisma.user.findFirst({
        where: {
          id: opts.user.id,
        },
      });

      return {
        ...opts.session,
        user: {
          ...opts.session.user,
          id: opts.user.id,
          robloxId: opts.session.user.image?.split(
            "https://thumbs.metrik.app/headshot/",
          )[1],
          onboarded: user?.onboarded ?? false,
          lilyToken: await hmac(env.LILY_TOKEN ?? "", opts.user.id),
          // intercomHash: await hmac(env.INTERCOM_SECRET!, opts.user.id),
        },
      };
    },
  },
  providers: [
    {
      id: "roblox",
      name: "Roblox",
      type: "oidc",
      wellKnown:
        "https://apis.roblox.com/oauth/.well-known/openid-configuration",
      authorization: {
        params: { scope: "openid profile" },
      },
      checks: ["pkce", "state"],
      profile(profile: {
        sub: string;
        preferred_username: string;
        picture: string | null;
      }) {
        return {
          id: profile.sub,
          name: profile.preferred_username,
          image: `https://thumbs.metrik.app/headshot/${profile.sub}`,
        };
      },
      clientId: env.ROBLOX_CLIENT_ID,
      clientSecret: env.ROBLOX_CLIENT_SECRET,
      issuer: "https://apis.roblox.com/oauth/",
      client: {
        authorization_signed_response_alg: "ES256",
        id_token_signed_response_alg: "ES256",
      },
    },
  ],
});
