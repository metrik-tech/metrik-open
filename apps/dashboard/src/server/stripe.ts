import Stripe from "stripe";

import { env } from "@/env.mjs";

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

export default stripe;

export { stripe, Stripe };
