import { useEffect } from "react";
import type { GetServerSidePropsContext } from "next";
import { Card } from "@tremor/react";
import { createServerSideHelpers } from "@trpc/react-query/server";
import { getQueryClient } from "@trpc/react-query/shared";
import { signOut, useSession } from "next-auth/react";
import { useLocalStorage } from "react-use";

import { Background } from "@/components/background";
import { Layout } from "@/components/base-layout";
import { PageWrapper } from "@/components/page-wrapper";

export default function Signout() {
  const { status } = useSession({ required: true });
  if (status === "authenticated") void signOut({ callbackUrl: "/auth/login" });
  const [_, setStudio] = useLocalStorage("persisted-studio", undefined);

  useEffect(() => {
    setStudio(undefined);
  }, [setStudio]);

  return (
    <Layout title="Signing out...">
      <div className="mx-auto flex h-screen w-full items-center justify-center  text-neutral-800 dark:text-neutral-200">
        <Background />
        <Card className="max-w-lg text-center">
          <p className="text-lg font-medium">Signing out...</p>
        </Card>
      </div>
    </Layout>
  );
}

Signout.PageWrapper = PageWrapper;
