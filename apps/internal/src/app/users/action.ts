"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { type ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { cookies } from "next/headers";
import { decode } from "@tsndr/cloudflare-worker-jwt";
import { Logger } from "next-axiom";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import { zfd } from "zod-form-data";

import { prisma } from "@metrik/db";
import { stripe } from "@metrik/stripe";

import { action } from "@/utils/action";
import { isAuthorizedForAdmin } from "@/utils/authorization";
import {
  addBannedUser,
  removeBannedUser,
  toggleEarlyAccess,
  togglePreviewEnvAccess,
} from "@/utils/config";

const getEmail = (cookies: ReadonlyRequestCookies) => {
  const jwt = cookies.get("CF_Authorization")?.value;

  if (!jwt) {
    return;
  }

  const { payload } = decode<{ email: string }>(jwt);

  if (!payload) {
    return;
  }

  return payload.email;
};

export const deleteUser = action(
  zfd.formData({
    id: z.string(),
  }),
  async ({ id }) => {
    const cookieStore = cookies();

    const email = getEmail(cookieStore) ?? "";
    const logger = new Logger({ source: "internal" });

    if (!isAuthorizedForAdmin(email)) {
      return;
    }

    logger.info("User deleted", { id, email });
    await logger.flush();
    // Delete user
    const user = await prisma.user.findFirst({
      where: {
        id,
      },
    });

    if (!user) {
      return;
    }

    const studios = await prisma.studio.findMany({
      where: {
        membership: {
          some: {
            userId: id,
            role: "OWNER",
          },
        },
      },
    });

    for (const studio of studios) {
      if (studio.stripeSubscriptionId) {
        await stripe.subscriptions.cancel(studio.stripeSubscriptionId);
      }
    }

    await prisma.studio.deleteMany({
      where: {
        membership: {
          some: {
            userId: id,
            role: "OWNER",
          },
        },
      },
    });

    await stripe.customers.del(user.stripeCustomerId!);

    return prisma.user.delete({
      where: {
        id,
      },
    });
  },
);

export async function ban(formData: FormData) {
  "use server";

  const cookieStore = cookies();
  const email = getEmail(cookieStore) ?? "";
  const logger = new Logger({ source: "internal" });

  if (!isAuthorizedForAdmin(email)) {
    return;
  }

  const data = {
    robloxId: Number(formData.get("robloxId") as string),
    reason: formData.get("reason") as string,
    friendlyIdentifier: formData.get("friendlyIdentifier") as string,
    expiry: formData.get("expiry") as string,
    appealable: formData.get("appealable"),
  };

  logger.info("Ban user", { email, data });
  await logger.flush();

  console.log(data);

  await addBannedUser({
    robloxId: Number(data.robloxId),
    reason: data.reason,
    friendlyIdentifier: data.friendlyIdentifier,
    timestamp: Math.floor(Date.now() / 1000),
    appealable: data.appealable === "on" ? true : false,
    expiry:
      data.expiry === ""
        ? null
        : Math.floor(new Date(data.expiry).getTime() / 1000),
  });

  // sleep
  await new Promise((r) => setTimeout(r, 2000));

  revalidatePath(`/users/${formData.get("userId") as string}`);

  return;
}

export const toggleEarlyAccessAction = action(
  zfd.formData({
    userId: z.string(),
  }),
  async ({ userId }) => {
    const cookieStore = cookies();

    const email = getEmail(cookieStore);
    const logger = new Logger({ source: "internal" });

    logger.info("Toggle early access", { email, userId });
    await logger.flush();
    await toggleEarlyAccess(Number(userId));

    return;
  },
);

export const unbanAction = action(
  zfd.formData({
    userId: z.string(),
  }),
  async ({ userId }) => {
    const cookieStore = cookies();

    const email = getEmail(cookieStore) ?? "";

    if (!isAuthorizedForAdmin(email)) {
      return;
    }
    const logger = new Logger({ source: "internal" });

    logger.info("Unban user", { email, userId });
    await logger.flush();
    await removeBannedUser(Number(userId));

    return;
  },
);

export const togglePreviewEnvAccessAction = action(
  zfd.formData({
    userId: z.string(),
  }),
  async ({ userId }) => {
    const cookieStore = cookies();

    const email = getEmail(cookieStore) ?? "";

    if (!isAuthorizedForAdmin(email)) {
      return;
    }

    const logger = new Logger({ source: "internal" });

    logger.info("Toggle preview env access", { email, userId });
    await logger.flush();

    await togglePreviewEnvAccess(Number(userId));

    return;
  },
);

export const deleteUserMembership = action(
  zfd.formData({
    id: z.string(),
  }),
  async ({ id }) => {
    const cookieStore = cookies();

    const email = getEmail(cookieStore) ?? "";

    if (!isAuthorizedForAdmin(email)) {
      return;
    }

    const logger = new Logger({ source: "internal" });

    logger.info("Delete user membership", { email, id });
    await logger.flush();

    return prisma.membership.delete({
      where: {
        id,
      },
    });
  },
);

export const deleteStudio = action(
  zfd.formData({
    id: z.string(),
  }),
  async ({ id }) => {
    const cookieStore = cookies();

    const email = getEmail(cookieStore) ?? "";

    if (!isAuthorizedForAdmin(email)) {
      return;
    }

    const logger = new Logger({ source: "internal" });

    logger.info("Delete studio", { email, id });
    await logger.flush();
    return prisma.studio.delete({
      where: {
        id,
      },
    });

    // TODO: CANCEL SUBSCRIPTIONS
  },
);
