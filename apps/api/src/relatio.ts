import { Elysia, t } from "elysia";

import { prisma } from "@metrik/db";

import { MError } from "./utils/error";
import { stripe } from "./utils/stripe";

export const relatioRouter = new Elysia({
  prefix: "/api/relatio",
})
  .derive(({ headers }) => {
    if (
      headers.authorization?.split(" ")[1] !== process.env.RELATIO_PROMO_API_KEY
    ) {
      throw new MError({
        message: "Invalid Relatio API Key",
        code: "UNAUTHORIZED",
      });
    }

    return {};
  })
  .post(
    "/promo/generate",
    async ({ body }) => {
      const { userId, studioId } = body;

      const [user, studio] = await prisma.$transaction([
        prisma.user.findUnique({
          where: {
            robloxId: userId,
            memberships: {
              some: {
                role: "OWNER",
                studioId: studioId,
              },
            },
          },
        }),
        prisma.studio.findFirst({
          where: {
            id: studioId,
          },
        }),
      ]);

      if (!user) {
        throw new MError({
          message: "User not found",
          code: "NOT_FOUND",
        });
      }

      if (!studio?.stripeCustomerId) {
        throw new MError({
          message: "Studio not found",
          code: "NOT_FOUND",
        });
      }

      const coupon = await stripe.coupons.create({
        amount_off: 100,
        currency: "usd",
        duration: "forever",
        metadata: {
          promotion: "relatio",
        },
        name: "Relatio Premium Plan Discount",
        max_redemptions: 1,
      });

      const promoCode = await stripe.promotionCodes.create({
        coupon: coupon.id,
        customer: studio?.stripeCustomerId,
        metadata: {
          promotion: "relatio",
          studioId: studio.id,
        },
      });

      return {
        studioId: studio.id,
        promoCode: promoCode.code,
      };
    },
    {
      type: "application/json",
      body: t.Object({
        userId: t.String(),
        studioId: t.String(),
      }),
    },
  )
  .post(
    "/promo/revoke",
    async ({ body }) => {
      const { userId, studioId } = body;

      const [user, studio] = await prisma.$transaction([
        prisma.user.findUnique({
          where: {
            robloxId: userId,
            memberships: {
              some: {
                role: "OWNER",
                studioId: studioId,
              },
            },
          },
        }),
        prisma.studio.findFirst({
          where: {
            id: studioId,
          },
        }),
      ]);

      if (!user) {
        throw new MError({
          message: "User not found",
          code: "NOT_FOUND",
        });
      }

      if (!studio?.stripeCustomerId) {
        throw new MError({
          message: "Studio not found",
          code: "NOT_FOUND",
        });
      }

      if (!studio.stripeSubscriptionId) {
        throw new MError({
          message: "Studio not subscribed",
          code: "NOT_FOUND",
        });
      }

      const subscription = await stripe.subscriptions.retrieve(
        studio.stripeSubscriptionId,
      );

      if (!subscription) {
        throw new MError({
          message: "Subscription not found",
          code: "NOT_FOUND",
        });
      }

      const promoCodeId = subscription.discount?.coupon?.id;

      if (
        !promoCodeId ||
        subscription.discount?.coupon?.metadata?.promotion !== "relatio"
      ) {
        throw new MError({
          message: "Promo code not found",
          code: "NOT_FOUND",
        });
      }

      await stripe.subscriptions.deleteDiscount(studio.stripeSubscriptionId);
      await stripe.promotionCodes.update(promoCodeId, {
        active: false,
      });

      return {
        message: "Promo code revoked",
      };
    },
    {
      type: "application/json",
      body: t.Object({
        userId: t.String(),
        studioId: t.String(),
      }),
    },
  )
  .get(
    "/promo/check",
    async ({ query }) => {
      const { userId, studioId } = query;

      const [user, studio] = await prisma.$transaction([
        prisma.user.findUnique({
          where: {
            robloxId: userId,
            memberships: {
              some: {
                role: "OWNER",
                studioId: studioId,
              },
            },
          },
        }),
        prisma.studio.findFirst({
          where: {
            id: studioId,
          },
        }),
      ]);

      if (!user) {
        throw new MError({
          message: "User not found",
          code: "NOT_FOUND",
        });
      }

      if (!studio?.stripeCustomerId) {
        throw new MError({
          message: "Studio not found",
          code: "NOT_FOUND",
        });
      }

      if (["FREE", "TRIAL", "UNSUBSCRIBED"].includes(studio.plan)) {
        return {
          status: "unpaid",
        };
      } else {
        return {
          status: "paid",
        };
      }
    },
    {
      query: t.Object({
        userId: t.String(),
        studioId: t.String(),
      }),
    },
  );
