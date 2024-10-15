"use client";

import { useRouter } from "next/router";
import { skipToken } from "@tanstack/react-query";
import { Card } from "@tremor/react";
import { useSession } from "next-auth/react";

import { AppNavbar } from "@/components/app-navbar";
import { Layout } from "@/components/base-layout";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Logo } from "@/components/logo";
import { Button } from "@/components/merlin/button";
import { PageWrapper } from "@/components/page-wrapper";
import { Footer } from "@/components/ui/footer";
import { api } from "@/utils/api";

export default function UserSettings() {
  const { data: session } = useSession();
  const router = useRouter();
  const utils = api.useUtils();
  const { data: user, isPending: isUserLoading } = api.users.get.useQuery(
    session ? { id: session.user.id } : skipToken,
  );
  const { data: discordAccount, isPending: isDiscordAccountLoading } =
    api.users.getDiscordAccount.useQuery();
  const { mutate: linkDiscordAccount, isPending: isLinkingDiscordAccount } =
    api.users.linkDiscordAccount.useMutation({
      onSuccess: async (data) => {
        await router.push(data);
      },
    });
  const { mutate: removeDiscordAccount, isPending: isRemovingDiscordAccount } =
    api.users.removeDiscordAccount.useMutation({
      onSuccess: async () => {
        await utils.users.getDiscordAccount.refetch();
        await utils.users.get.refetch({ id: session!.user.id });
      },
    });

  if (isUserLoading) {
    return (
      <Layout
        title="User Settings"
        className="flex h-screen items-center justify-center"
      >
        <LoadingSpinner />
      </Layout>
    );
  }

  return (
    <Layout title="User Settings">
      <div className="mx-auto w-full px-4 pb-3 dark:border-b dark:bg-dark-tremor-background  sm:px-6">
        <AppNavbar session={session} studio={false} />
      </div>
      <div className="mx-4 space-y-6 pt-20 md:mx-auto lg:max-w-7xl">
        <h1 className="font-display text-3xl font-medium">User Settings</h1>

        <Card>
          <h4 className="font-display text-xl font-semibold">
            Link Discord Account
          </h4>
          <p className="mb-3 mt-2 text-sm text-neutral-800 dark:text-neutral-400">
            Link your Discord account to your Metrik account to allow our
            support team to verify ownership of your account.
          </p>

          {!discordAccount ? (
            <Button
              variant="solid"
              className="mt-2"
              onClick={() => linkDiscordAccount()}
              disabled={isDiscordAccountLoading}
              loading={isLinkingDiscordAccount || isDiscordAccountLoading}
            >
              {isDiscordAccountLoading ? "Loading..." : "Link Discord Account"}
            </Button>
          ) : (
            <div>
              <p className="text-sm text-neutral-800 dark:text-neutral-400">
                Connected account:{" "}
                <span className="font-mono">{discordAccount.username}</span>
              </p>
              <Button
                variant="destructive"
                className="mt-2"
                onClick={() => removeDiscordAccount()}
                loading={isRemovingDiscordAccount}
              >
                Remove Discord Account
              </Button>
            </div>
          )}
        </Card>

        <Card>
          <h4 className="font-display text-xl font-semibold">Danger Zone</h4>
          <p className="mb-3 mt-2 text-sm text-neutral-800 dark:text-neutral-400">
            Proceed with caution.
          </p>

          <Button variant="destructive" disabled className="mt-2">
            To request account deletion please open a ticket in our Discord
            server.
          </Button>
        </Card>
      </div>
    </Layout>
  );
}

UserSettings.PageWrapper = PageWrapper;
