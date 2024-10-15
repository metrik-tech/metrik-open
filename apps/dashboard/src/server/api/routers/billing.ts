import { trytm } from "@bdsqqq/try";

import { z } from "zod";

import { nid } from "@metrik/id";

import { env } from "@/env.mjs";
import type { Stripe } from "@/server/stripe";
import { constants } from "@/utils/stripe/constants";
import { createTRPCRouter, protectedProcedure, TRPCError } from "../trpc";

const toDateTime = (secs: number) => {
  const t = new Date("1970-01-01T00:30:00Z"); // Unix epoch start.
  t.setSeconds(secs);
  return t;
};

export const billingRouter = createTRPCRouter({
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        studioId: z.string(),

        metadata: z.record(z.string(), z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const studio = await ctx.prisma.studio.findFirst({
        where: {
          id: input.studioId,
          membership: {
            some: {
              userId: ctx.session.user.id,
              role: "OWNER",
            },
          },
        },
      });

      const user = await ctx.prisma.user.findUnique({
        where: {
          id: ctx.session.user.id,
        },
      });

      if (!studio) {
        throw new TRPCError({
          message: "Studio not found",
          code: "NOT_FOUND",
        });
      }

      const session = await ctx.stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        customer: user?.stripeCustomerId as string,
        line_items: constants.plans.PRO.items[
          process.env.VERCEL
            ? process.env.VERCEL_ENV === "production"
              ? "production"
              : "test"
            : "test"
        ].map((price) => ({
          price: price.id,
          quantity: price.quantity,
        })),

        mode: "subscription",
        allow_promotion_codes: true,
        subscription_data: {
          description: `${studio.name}`,
          metadata: {
            ...input.metadata,
            plan: "PRO",
            planSlug: "Pro",
            studioId: studio.id,
            studioName: studio.name,
            userId: ctx.session.user.id,
          },
        },
        success_url: `${ctx.config.baseUrl()}/settings?studio=${studio.id}&tab=billing&success=true`,
        cancel_url: `${ctx.config.baseUrl()}/settings?tab=billing`,
      });

      return { sessionId: session.id };
    }),
  createStudioCheckoutSession: protectedProcedure
    .input(
      z.object({
        studioName: z.string(),

        metadata: z.record(z.string(), z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: {
          id: ctx.session.user.id,
        },
      });

      if (!user?.stripeCustomerId) {
        throw new TRPCError({
          message: "User not found",
          code: "NOT_FOUND",
        });
      }

      const id = nid();

      const session = await ctx.stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        customer: user.stripeCustomerId,
        line_items: constants.plans.PRO.items[
          env.VERCEL_ENV === "production" ? "production" : "test"
        ].map((price) => ({
          price: price.id,
          quantity: price.quantity,
        })),
        mode: "subscription",
        allow_promotion_codes: true,
        subscription_data: {
          description: `${input.studioName}`,
          metadata: {
            ...input.metadata,
            plan: "PRO",
            planSlug: "Pro",
            studioName: input.studioName,
            studioId: id,
            userId: ctx.session.user.id,
          },
        },
        success_url: `${ctx.config.baseUrl()}/settings?studio=${id}&tab=billing&success=true`,
        cancel_url: `${ctx.config.baseUrl()}/settings?tab=billing`,
      });

      return { sessionId: session.id };
    }),
  createPortalLink: protectedProcedure.mutation(async ({ ctx, input }) => {
    const user = await ctx.prisma.user.findUnique({
      where: {
        id: ctx.session.user.id,
      },
    });

    if (!user) {
      throw new TRPCError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    const link = await ctx.stripe.billingPortal.sessions.create({
      customer: user?.stripeCustomerId as string,
      return_url: `${ctx.config.baseUrl()}/settings?tab=billing`,
    });

    return { url: link.url };
  }),

  getPlans: protectedProcedure.query(({ ctx }) => {
    const pro =
      constants.plans.PRO.items[
        env.VERCEL_ENV === "production" ? "production" : "test"
      ];

    return {
      pro,
    };
  }),
  getPaymentMethod: protectedProcedure
    .input(
      z.object({
        paymentMethodId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const paymentMethod = await ctx.stripe.paymentMethods.retrieve(
        input.paymentMethodId,
      );

      return paymentMethod;
    }),
  getInvoices: protectedProcedure
    .input(
      z.object({
        studioId: z.string(),

        limit: z.number().optional(),
        startingAfter: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const studio = await ctx.prisma.studio.findFirst({
        where: {
          id: input.studioId,
          membership: {
            some: {
              userId: ctx.session.user.id,
              role: "OWNER",
            },
          },
        },
      });

      if (!studio) {
        throw new TRPCError({
          message: "Studio not found",
          code: "NOT_FOUND",
        });
      }

      const invoices = await ctx.stripe.invoices.list({
        customer: studio.stripeCustomerId!,
        limit: input.limit,
        starting_after: input.startingAfter,
      });

      return invoices;
    }),
  getAllDetails: protectedProcedure
    .input(
      z.object({
        studioId: z.string(),
        invoices: z
          .object({
            limit: z.number().optional(),
            startingAfter: z.string().optional(),
          })
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: {
          id: ctx.session.user.id,
        },
      });

      const studio = await ctx.prisma.studio.findFirst({
        where: {
          id: input.studioId,
          membership: {
            some: {
              userId: ctx.session.user.id,
              role: "OWNER",
            },
          },
        },
      });

      if (!studio) {
        throw new TRPCError({
          message: "Error resolving studio",
          code: "UNAUTHORIZED",
        });
      }

      if (!studio.stripeSubscriptionId) {
        return {
          subscription: null,
          metadata: null,
          invoices: null,
          paymentMethod: null,
        };
      }

      interface StripeSubscription extends Stripe.Subscription {
        metadata: {
          plan: string;
        };
      }

      const subscription = (await ctx.stripe.subscriptions.retrieve(
        studio.stripeSubscriptionId,
      )) as unknown as StripeSubscription;

      const invoices = await ctx.stripe.invoices.list({
        customer: user?.stripeCustomerId as string,
        subscription: subscription.id,
        limit: input.invoices?.limit,
        starting_after: input.invoices?.startingAfter,
      });

      if (!subscription.default_payment_method) {
        return {
          subscription,
          metadata: subscription.metadata,
          invoices,
          paymentMethod: null,
        };
      }

      const paymentMethod = await ctx.stripe.paymentMethods.retrieve(
        subscription.default_payment_method as string,
      );

      return {
        subscription,
        metadata: subscription.metadata,
        invoices,
        paymentMethod,
      };
    }),
});
