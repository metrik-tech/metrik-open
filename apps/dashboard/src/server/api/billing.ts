import { type Logger } from "next-axiom";

import { prisma } from "@metrik/db";
import type { Membership, Plan } from "@metrik/db/client";
import { nid } from "@metrik/id";

import { env } from "@/env.mjs";
import { stripe, type Stripe } from "@/server/stripe";
import { normalize } from "@/utils/ascii";
import { log } from "@/utils/log";
import { constants } from "@/utils/stripe/constants";

const toDateTime = (secs: number) => {
  const t = new Date("1970-01-01T00:30:00Z"); // Unix epoch start.
  t.setSeconds(secs);
  return t;
};

interface StripeSubscription extends Stripe.Subscription {
  metadata: {
    plan: string;
    enterprise: string;
  };
}

function capitalizeFirstLetter(string: string): string {
  return string.toLowerCase().charAt(0).toUpperCase() + string.slice(1);
}

export async function handleCheckoutSessionComplete(
  event: Stripe.Event,
  logger: Logger,
) {
  const session = event.data.object as Stripe.Checkout.Session;
  const subscriptionId = session.subscription;
  const subscription = await stripe.subscriptions.retrieve(
    subscriptionId as string,
  );
  console.log(subscription);
  const { studioId, studioName, userId } = subscription.metadata as {
    studioId: string;
    studioName: string;
    userId: string;
  };

  const plan =
    constants.plans[subscription.metadata.plan as keyof typeof constants.plans];

  if (!plan) {
    throw new Error("Plan not found");
  }

  logger.info("New subscription", subscription);

  const studio = await prisma.studio.upsert({
    where: {
      id: studioId,
    },
    create: {
      id: studioId,
      name: normalize(studioName),
      plan: plan.plan as Plan,
      planSlug: plan.planSlug,
      stripeSubscriptionId: subscription.id,
      usageLimits: {
        create: {
          id: nid(),
          ...plan.usageLimits,
        },
      },
      membership: {
        create: {
          id: nid(),
          userId,
          role: "OWNER",
        },
      },
    },
    update: {
      plan: plan.plan as Plan,
      planSlug: plan.planSlug,
      usageLimits: {
        upsert: {
          create: { id: nid(), ...plan.usageLimits },
          update: plan.usageLimits,
        },
      },
      stripeSubscriptionId: subscription.id,
      trialEnds: null,
    },
    include: {
      membership: true,
    },
  });

  await log({
    message: ":tada: New subscription",
    data: [
      { name: "Studio Name", value: studio?.name },
      { name: "Studio ID", value: `\`${studio?.id}\`` },
      {
        name: "Owner",
        value: `\`${studio.membership.find((member) => member.role === "OWNER")?.userId ?? "Error"}\``,
      },
      {
        name: "Open in Stripe",
        value: `https://dashboard.stripe.com/${
          env.VERCEL_ENV === "production" ? "" : "test/"
        }subscriptions/${subscription.id}`,
      },
    ],
  });

  return;
}

export async function handleInvoicePaid(event: Stripe.Event, logger: Logger) {
  const invoice = event.data.object as Stripe.Invoice;
  const subscriptionId = invoice.subscription;
  const subscription = await stripe.subscriptions.retrieve(
    subscriptionId as string,
  );
  const { studioId, studioName, userId } = subscription.metadata as {
    studioId: string;
    studioName: string;
    userId: string;
  };

  const studio = await prisma.studio.findFirst({
    where: {
      id: studioId,
    },
  });

  if (studio) {
    return;
  }

  const plan =
    constants.plans[subscription.metadata.plan as keyof typeof constants.plans];

  if (!plan) {
    throw new Error("Plan not found");
  }

  await prisma.studio.update({
    where: {
      id: studioId,
    },

    data: {
      plan: plan.plan as Plan,
      planSlug: plan.planSlug,
      stripeSubscriptionId: subscription.id,
      usageLimits: {
        create: { id: nid(), ...plan.usageLimits },
      },
    },
  });

  return;
}

export async function handleSubscriptionCreatedOrUpdated(
  event: Stripe.Event,
  logger: Logger,
) {
  const subscription = event.data.object as Stripe.Subscription;
  const { studioId, studioName, userId } = subscription.metadata;

  if (subscription.status === "canceled") {
    return; //handleSubscriptionCanceled(event);
  }

  console.log(subscription.metadata);

  const plan =
    constants.plans[subscription.metadata.plan as keyof typeof constants.plans];

  if (!plan) {
    throw new Error("Plan not found");
  }

  const studio = await prisma.studio.findFirst({
    where: {
      id: studioId,
    },
  });

  if (!studio) {
    return;
  }

  await prisma.studio.update({
    where: {
      id: studioId,
    },
    data: {
      plan: plan.plan as Plan,
      planSlug: plan.planSlug,
      stripeSubscriptionId: subscription.id,
      usageLimits: {
        upsert: {
          create: { id: nid(), ...plan.usageLimits },
          update: plan.usageLimits,
        },
      },
    },
    include: {
      membership: true,
    },
  });

  return;
}

export async function handleSubscriptionCanceled(
  event: Stripe.Event,
  logger: Logger,
) {
  const { plan, planSlug, usageLimits } = constants.plans.NONE;
  const subscription = event.data.object as Stripe.Subscription;
  const { studioId } = subscription.metadata;

  const studio = await prisma.studio.findFirst({
    where: {
      id: studioId,
    },
    include: {
      membership: true,
    },
  });

  if (!studio) {
    return;
  }

  await prisma.studio.update({
    where: {
      id: studioId,
    },
    data: {
      plan: plan as Plan,
      planSlug,
      usageLimits: {
        update: usageLimits,
      },
      stripeSubscriptionId: null,
    },
  });

  const owner = studio.membership.find((m) => m.role === "OWNER");

  await log({
    message: ":cry: Subscription canceled",
    data: [
      { name: "Studio Name", value: studio.name },
      { name: "Studio ID", value: `\`${studio.id}\`` },
      { name: "Owner", value: `\`${owner?.userId ?? "Error"}\`` },
      {
        name: "Open in Stripe",
        value: `https://dashboard.stripe.com/${
          env.NODE_ENV === "production" ? "" : "test/"
        }subscriptions/${subscription.id}`,
      },
    ],
  });

  return;
}

export async function newCheckoutSessionComplete({
  customerId,
  subscriptionId,
}: {
  customerId: string;
  subscriptionId: string;
}) {
  const { plan, planSlug, usageLimits } = constants.plans.FREE;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  const studio = await prisma.studio.findFirst({
    where: {
      stripeCustomerId: customerId,
    },
    include: {
      membership: true,
    },
  });

  if (!studio) {
    console.log("Studio does not exist");
  }

  const owner = studio?.membership.find(
    (m) => m.role === "OWNER",
  ) as Membership;

  await log({
    message: ":tada: New subscription",
    data: [
      { name: "Studio", value: studio?.name },
      { name: "Owner", value: `\`${owner.userId ?? "Error"}\`` },
      {
        name: "Open in Stripe",
        value: `https://dashboard.stripe.com/${
          env.VERCEL_ENV === "production" ? "" : "test/"
        }subscriptions/${subscriptionId}`,
      },
    ],
  });

  return studio;
}

export async function newSubscriptionCanceled({
  subscriptionId,
  customerId,
}: {
  subscriptionId: string;
  customerId: string;
}) {
  const { plan, planSlug, usageLimits } = constants.plans.FREE;

  const studio = await prisma.studio.update({
    where: {
      stripeCustomerId: customerId,
    },
    data: {
      plan: plan as Plan,
      planSlug,
      usageLimits: {
        update: usageLimits,
      },
      stripeSubscriptionId: null,
    },
    include: {
      membership: true,
    },
  });

  const owner = studio.membership.find((m) => m.role === "OWNER") as Membership;

  await log({
    message: ":cry: Subscription canceled",
    data: [
      { name: "Studio", value: studio.name },
      { name: "Owner", value: `\`${owner.userId ?? "Error"}\`` },
      {
        name: "Open in Stripe",
        value: `https://dashboard.stripe.com/${
          env.NODE_ENV === "production" ? "" : "test/"
        }subscriptions/${subscriptionId}`,
      },
    ],
  });

  return studio;
}

export async function newSubscriptionUpdated({
  customerId,
  subscriptionId,
  subscription,
}: {
  customerId: string;
  subscriptionId: string;
  subscription: StripeSubscription;
}) {
  const newPriceId = subscription.items.data[0]?.price.id;

  if (subscription.metadata.enterprise === "true") {
    return;
  }

  const plan =
    constants.plans[subscription.metadata.plan as keyof typeof constants.plans];

  if (!plan) {
    await log({
      message: "Plan not found",
      data: [{ name: "Price ID", value: newPriceId }],
    });

    return;
  }

  const studio = await prisma.studio.update({
    where: {
      stripeCustomerId: customerId,
    },
    data: {
      plan: plan.plan as Plan,
      planSlug: plan.planSlug,
      usageLimits: {
        upsert: {
          create: { id: nid(), ...plan.usageLimits },
          update: plan.usageLimits,
        },
      },
      stripeSubscriptionId: subscription.id,
    },
  });

  return studio;
}

// export async function subscriptionCanceled({
//   subscriptionId,
//   customerId,
// }: {
//   subscriptionId: string;
//   customerId: string;
// }) {
//   const studio = await prisma.studio.findFirst({
//     where: {
//       stripeCustomerId: customerId,
//     },
//   });

//   if (!studio) {
//     throw new Error("Studio not found");
//   }
//   const subscription = await stripe.subscriptions.retrieve(subscriptionId);

//   if (
//     subscription.status !== "canceled" ||
//     !subscription.cancel_at_period_end
//   ) {
//     throw new Error("Subscription is not canceled");
//   }

//   const dbSubscription = await prisma.subscription.findFirst({
//     where: {
//       subscriptionId,
//       studioId: studio.id,
//     },
//   });

//   if (!dbSubscription) {
//     throw new Error("Subscription not found");
//   }

//   console.log("Deleting subscription", dbSubscription.id);

//   const deleted = await prisma.subscription.delete({
//     where: {
//       id: dbSubscription.id,
//     },
//   });

//   return deleted;
// }

// export async function subscriptionCreated({
//   subscriptionId,
//   customerId,
// }: {
//   subscriptionId: string;
//   customerId: string;
// }) {
//   const studio = await prisma.studio.findFirst({
//     where: {
//       stripeCustomerId: customerId,
//     },
//   });

//   if (!studio) {
//     throw new Error("Studio not found");
//   }

//   const dbSubscription = await prisma.subscription.findFirst({
//     where: {
//       subscriptionId,
//       studioId: studio.id,
//     },
//   });

//   if (dbSubscription) {
//     throw new Error("Subscription already exists");
//   }

//   const subscription = await stripe.subscriptions.retrieve(subscriptionId);

//   if (subscription.status === "canceled") {
//     return subscriptionCanceled({ subscriptionId, customerId });
//   }

//   const subscriptionData = {
//     subscriptionId: subscription.id,
//     customerId: subscription.customer as string,
//     status: subscription.status.toUpperCase() as SubscriptionStatus,
//     prices: {
//       create: subscription.items.data.map((item) => ({
//         price: item as never,
//       })),
//     },
//     currentPeriodStart: toDateTime(subscription.current_period_start),
//     currentPeriodEnd: toDateTime(subscription.current_period_end),
//     cancelAtPeriodEnd: subscription.cancel_at_period_end,
//     metadata: subscription.metadata as never,
//     defaultPaymentMethodId: subscription.default_payment_method as string,
//     created: toDateTime(subscription.created),
//     studioId: studio.id,
//   };

//   console.log("Upserting subscription");

//   const upsertSubscription = await prisma.subscription.upsert({
//     where: {
//       studioId: studio.id,
//     },
//     create: subscriptionData,
//     update: subscriptionData,
//   });

//   return upsertSubscription;
// }

// export async function manageSubscriptionStatusChange({
//   subscriptionId,
//   customerId,
//   event,
// }: {
//   subscriptionId: string;
//   customerId: string;
//   event?: Stripe.Event;
// }) {
//   const studio = await prisma.studio.findFirst({
//     where: {
//       stripeCustomerId: customerId,
//     },
//   });

//   if (!studio) {
//     throw new Error("Studio not found");
//   }

//   const subscription = await stripe.subscriptions.retrieve(subscriptionId);

//   if (event && event.type === "customer.subscription.deleted") {
//     return subscriptionCanceled({ subscriptionId, customerId });
//   }

//   const subscriptionData = {
//     subscriptionId: subscription.id,
//     customerId: subscription.customer as string,
//     status: subscription.status.toUpperCase() as SubscriptionStatus,
//     prices: {
//       create: subscription.items.data.map((item) => ({
//         price: item as never,
//       })),
//     },
//     currentPeriodStart: toDateTime(subscription.current_period_start),
//     currentPeriodEnd: toDateTime(subscription.current_period_end),
//     cancelAtPeriodEnd: subscription.cancel_at_period_end,
//     metadata: subscription.metadata as never,
//     defaultPaymentMethodId: subscription.default_payment_method as string,
//     created: toDateTime(subscription.created),
//     studioId: studio.id,
//   };

//   console.log("Upserting subscription");

//   const dbSubscription = await prisma.subscription.upsert({
//     where: {
//       subscriptionId: subscription.id,
//     },
//     create: subscriptionData,
//     update: subscriptionData,
//   });

//   return dbSubscription;
// }
