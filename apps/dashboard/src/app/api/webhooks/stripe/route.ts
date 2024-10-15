/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Readable } from "node:stream";
import type { NextApiRequest, NextApiResponse } from "next";
import { type NextRequest } from "next/server";
import { withAxiom, type AxiomRequest } from "next-axiom";
import type Stripe from "stripe";

import { prisma } from "@metrik/db";

import { env } from "@/env.mjs";
import {
  handleCheckoutSessionComplete,
  handleInvoicePaid,
  handleSubscriptionCanceled,
  handleSubscriptionCreatedOrUpdated,
  newCheckoutSessionComplete,
  newSubscriptionCanceled,
  newSubscriptionUpdated,
} from "@/server/api/billing";
import { stripe } from "@/server/stripe";

async function buffer(readable: Readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

const relevantEvents = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  // "customer.subscription.deleted",
]);

interface StripeSubscription extends Stripe.Subscription {
  metadata: {
    plan: string;
    enterprise: string;
  };
}

const stripeWebhook = withAxiom(async (req: AxiomRequest) => {
  const buf = Buffer.from(await req.arrayBuffer());
  const sig = req.headers.get("stripe-signature") as string;
  const endpointSecret = env.STRIPE_WEBHOOK_SECRET;
  let event: Stripe.Event | undefined;

  let webhookError: Response | undefined;

  try {
    if (!sig || !endpointSecret) {
      webhookError = new Response("Bad request", { status: 400 });
      return;
    }

    event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
  } catch (err: any) {
    req.log.error("Stripe webhook error", { error: err as unknown });

    webhookError = new Response(
      `Webhook Error: ${(err as unknown as Error).message}`,
      {
        status: 400,
      },
    );

    return;
  }

  if (webhookError) {
    return webhookError;
  }

  let dataError: Response | undefined;

  console.log(event.type);

  if (event) {
    req.log.info("Stripe event", { event, type: event.type });
    try {
      switch (event.type) {
        // case "invoice.paid":
        //   await handleInvoicePaid(event);
        //   break;
        // case "customer.subscription.created":
        //   await handleSubscriptionCreatedOrUpdated(event);
        //   break;
        case "customer.subscription.updated":
          await handleSubscriptionCreatedOrUpdated(event, req.log);
          break;
        case "checkout.session.completed":
          await handleCheckoutSessionComplete(event, req.log);
          break;
        case "customer.subscription.deleted":
          await handleSubscriptionCanceled(event, req.log);
          break;
        case "invoice.payment_failed":
          break;
        default:
      }
    } catch (err: any) {
      req.log.error("Stripe webhook error", {
        error: err as unknown,
        type: event.type,
      });
      dataError = new Response((err as unknown as Error).message, {
        status: 500,
      });
      return;
    }
  }

  if (dataError) {
    return dataError;
  }

  return new Response("ok", { status: 200 });
});

export { stripeWebhook as POST };
