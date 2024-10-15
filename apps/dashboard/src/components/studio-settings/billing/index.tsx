"use client";

import Link from "next/link";
import { CreditCardIcon, LockClosedIcon } from "@heroicons/react/16/solid";
import { BoltIcon, ChevronLeftIcon } from "@heroicons/react/20/solid";
import {
  Badge,
  Button,
  Card,
  Flex,
  List,
  ListItem,
  ProgressBar,
} from "@tremor/react";
import clsx from "clsx";
import { format } from "date-fns";
import { CheckIcon } from "lucide-react";
import { toast } from "sonner";
import Stripe from "stripe";

import type { Project, Studio } from "@metrik/db/client";

import { Logo } from "@/components/logo";
import { Button as MerlinButton } from "@/components/merlin/button";
import { useProject } from "@/hooks/project";
import { useStudio } from "@/hooks/studio";
import { api } from "@/utils/api";
import { constants } from "@/utils/stripe/constants";
import getStripe from "@/utils/stripejs";
import { useMembership } from "../../hooks/membership";
import { LoadingSpinner } from "../../loading-spinner";
import { Footer } from "../../ui/footer";

function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const moneyFormatter = (value: number) =>
  `$${parseInt(Intl.NumberFormat("us").format(value)).toFixed(2).toString()}`;

const numberFormatter = (value: number) =>
  `${Intl.NumberFormat("us").format(value).toString()}`;

const reasonsToUpgrade = [
  "100 Projects",
  "100,000 Experience visits a month included",
  "90 day storage for Analytics and Audit logs",
  "5000 Moderation events a month",
  "1000 unique Issues ",
  "500 Action runs",
  "500 Broadcasts",
  "100 Dynamic flags, 1000 Static flags",
  "Priority support",
  "Support the development of Metrik",
];

export function BillingPage() {
  const { currentStudio } = useStudio();
  const { isOwner } = useMembership();
  const { projects } = useProject();
  const { mutate, isPending: isLoading } =
    api.billing.createPortalLink.useMutation({
      onSuccess: (data) => {
        window.location.assign(data.url);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  const { data: usageLimits } = api.studios.getUsageLimits.useQuery(
    { studioId: currentStudio?.id as string },
    {
      enabled: !!currentStudio,
    },
  );

  const { data: billingDetails, isPending: isBillingLoading } =
    api.billing.getAllDetails.useQuery(
      { studioId: currentStudio?.id as string },
      {
        staleTime: 1000 * 60 * 3,
        enabled: !!currentStudio,
      },
    );

  const { mutate: goPro, isPending: isGoProLoading } =
    api.billing.createCheckoutSession.useMutation({
      onSuccess: async (data) => {
        const stripe = await getStripe();

        await stripe?.redirectToCheckout({ sessionId: data.sessionId });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  return (
    <div>
      {!billingDetails && isBillingLoading ? (
        <Card className={clsx("mb-4 flex h-64 items-center justify-center")}>
          <div className="flex" role="status">
            <LoadingSpinner />
          </div>
        </Card>
      ) : isOwner && billingDetails && currentStudio ? (
        <>
          <div
            className={clsx(
              "mb-4 grid gap-4",
              currentStudio.plan === "TRIAL" ? "md:grid-cols-2" : "",
            )}
          >
            {currentStudio.plan === "TRIAL" && (
              <Card>
                <Flex>
                  <div>
                    <h4 className="mb-4 text-lg font-medium">
                      Subscribe to Metrik before your trial ends
                    </h4>

                    <ul className="columns-2 space-y-1">
                      {reasonsToUpgrade.map((reason) => (
                        <li
                          className="flex items-center space-x-1.5 text-xs"
                          key={reason}
                        >
                          <CheckIcon className="h-4 w-4 flex-shrink-0  self-start text-green-500" />{" "}
                          <span className="text-neutral-800 dark:text-neutral-400">
                            {reason}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* <div className="flex items-center justify-center">
                    <span className="mr-20 rounded-md border border-blue-500 px-2 py-1 text-xl text-blue-500">
                      $10/mo
                    </span>
                  </div> */}
                </Flex>

                <div className="flex w-full justify-end">
                  {isOwner &&
                    billingDetails &&
                    !billingDetails.subscription && (
                      <MerlinButton
                        // variant="light"

                        className="mt-4"
                        onClick={() => {
                          goPro({
                            studioId: currentStudio?.id,
                          });
                        }}
                        loading={isGoProLoading}
                        prefix={Logo}
                      >
                        Subscribe to Metrik
                      </MerlinButton>
                    )}
                </div>
              </Card>
            )}
            <Card>
              <Flex className="mb-4">
                <h4 className="font-display text-xl font-medium">Account</h4>
                {isOwner && !isBillingLoading && (
                  <MerlinButton
                    variant={"outline"}
                    prefix={CreditCardIcon}
                    size="sm"
                    onClick={() => mutate()}
                    disabled={!currentStudio}
                    loading={isLoading}
                  >
                    Go to Billing Portal
                  </MerlinButton>
                )}
              </Flex>

              <List className="text-neutral-800 dark:text-neutral-400">
                <ListItem className=" text-left">
                  <span className="font-medium">Current Plan</span>
                  <span>
                    {currentStudio ? currentStudio.planSlug : "Unsubscribed"}
                  </span>
                </ListItem>
                {billingDetails.subscription && (
                  <>
                    <ListItem className=" text-left ">
                      <span className="font-medium">Account Status</span>
                      <span>
                        <Badge
                          color={
                            billingDetails.subscription?.status === "active"
                              ? undefined
                              : "amber"
                          }
                        >
                          {capitalizeFirstLetter(
                            billingDetails.subscription?.status.toLowerCase() ||
                              "N/A",
                          )}
                        </Badge>
                      </span>
                    </ListItem>
                    <ListItem className=" text-left ">
                      <span className="font-medium">Billing Email</span>
                      <span>
                        {billingDetails.paymentMethod?.billing_details.email ??
                          "No email attached"}
                      </span>
                    </ListItem>
                    <ListItem className=" text-left ">
                      <span className="font-medium">Billing Name</span>
                      <span>
                        {billingDetails.paymentMethod?.billing_details.name}
                      </span>
                    </ListItem>
                    <ListItem className=" text-left ">
                      <span className="font-medium">Payment Method</span>
                      <span>
                        {capitalizeFirstLetter(
                          billingDetails.paymentMethod?.card?.brand ?? "N/A",
                        )}
                        , Charged automatically
                      </span>
                    </ListItem>
                    <ListItem className=" text-left ">
                      <span className="font-medium">Last Invoice</span>

                      <span>
                        {moneyFormatter(
                          (billingDetails.invoices?.data[0]
                            ?.amount_paid as number) / 100,
                        )}
                        <span className="ml-2">
                          {billingDetails.invoices?.data[0]?.status ===
                          "paid" ? (
                            <Badge color="green">Paid</Badge>
                          ) : (
                            <Badge color="amber">Unpaid</Badge>
                          )}
                        </span>
                      </span>
                    </ListItem>
                    <ListItem className=" text-left ">
                      <span className="font-medium">Period</span>

                      <span>
                        {format(
                          billingDetails.subscription?.current_period_start *
                            1000 || new Date(),
                          "LLL d",
                        )}{" "}
                        -{" "}
                        {format(
                          billingDetails.subscription?.current_period_end *
                            1000 || new Date(),
                          "LLL d",
                        )}
                      </span>
                    </ListItem>
                  </>
                )}
              </List>

              <Footer height="h-10">
                <p className="flex items-center text-xs text-neutral-500 dark:text-neutral-400">
                  <LockClosedIcon className="mr-1 h-3.5 w-3.5" />
                  <span>
                    Your billing details are stored securely on{" "}
                    <Link href="https://stripe.com" target="_blank">
                      Stripe
                    </Link>
                    &apos;s servers.{" "}
                    <span className="hidden 2xl:inline">
                      They never touch our database.
                    </span>
                  </span>
                </p>
              </Footer>
            </Card>
          </div>
        </>
      ) : (
        <></>
      )}

      {projects && (
        <Card>
          <h4 className="mb-4 font-display text-xl font-medium">Usage</h4>
          <p className="mb-3 mt-2 text-sm text-neutral-800 dark:text-neutral-400">
            Your plan includes{" "}
            {numberFormatter(usageLimits?.experienceVisitsCount ?? 0)} visits
            per month, and are billed at a rate of $0.0001 per visit past that.
          </p>

          {/* <div className="grid gap-4 md:grid-cols-2">
            {projects.map((project) => (
              <div key={project.id}>
                <Card className="mb-4 space-y-4">
                  <Link
                    href={`/projects/${project.id}/analytics`}
                    className="text-lg font-medium"
                  >
                    {project.name}
                  </Link>
                  <div>
                    <Flex className="mb-1 text-sm">
                      <p className="font-medium">Logs</p>
                      <p>2500 included</p>
                    </Flex>

                    <ProgressBar value={(2108 / 2500) * 100} />
                    <p className="mt-1 text-sm">Used 2108</p>
                  </div>
                  <div>
                    <Flex className="mb-1 text-sm">
                      <p className="font-medium">Hooks</p>
                      <p>250 included</p>
                    </Flex>

                    <ProgressBar value={(128 / 250) * 100} />
                    <p className="mt-1 text-sm">Used 128</p>
                  </div>
                  <div>
                    <Flex className="mb-1 text-sm">
                      <p className="font-medium">Moderation</p>
                      <p>250 included</p>
                    </Flex>

                    <ProgressBar value={(32 / 250) * 100} />
                    <p className="mt-1 text-sm">Used 32</p>
                  </div>
                </Card>
              </div>
            ))}
          </div> */}
        </Card>
      )}
    </div>
  );
}
