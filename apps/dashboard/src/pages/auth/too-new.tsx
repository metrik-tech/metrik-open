"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { Card } from "@tremor/react";

import { Background } from "@/components/background";
import { Layout } from "@/components/base-layout";
import { Logo } from "@/components/logo";
import { PageWrapper } from "@/components/page-wrapper";

export default function TooNew() {
  const router = useRouter();
  const user = router.query.user;

  return (
    <Layout title="Account too new">
      <Background />
      <div className="flex min-h-screen flex-col">
        <section className="mt-52 flex-1 p-4 ">
          <div className="mx-auto max-w-5xl">
            <div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8">
              {/* <div className="text-center sm:mx-auto sm:w-full sm:max-w-md">
                <Logo className="mx-auto h-[50px] w-[50px] text-center sm:w-full sm:max-w-md" />
              </div> */}
              <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <Card>
                  <div className="text-center">
                    {user && user !== "undefined" ? (
                      <p className="font-medium">
                        The Roblox account{" "}
                        <span className="font-mono">{user}</span> is too new.
                      </p>
                    ) : (
                      <p className="font-medium">
                        Your Roblox account is too new.
                      </p>
                    )}

                    <p className="mt-2 text-sm text-neutral-800 dark:text-neutral-400 sm:text-xs">
                      Please wait until your account is 30 days old and try
                      again.
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}

TooNew.PageWrapper = PageWrapper;
