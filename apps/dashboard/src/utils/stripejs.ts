import type { Stripe } from "@stripe/stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import { env } from "@/env.mjs";

let stripePromise: Promise<Stripe | null>;
const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(env.NEXT_PUBLIC_STRIPE_KEY);
  }
  return stripePromise;
};

export default getStripe;
