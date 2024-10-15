"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { Card } from "@tremor/react";
import Balancer from "react-wrap-balancer";

import { Background } from "@/components/background";
import { Layout } from "@/components/base-layout";
import { Logo } from "@/components/logo";
import { PageWrapper } from "@/components/page-wrapper";

export default function Banned() {
  const router = useRouter();
  const user = router.query.user;

  return (
    <Layout title="Banned">
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
                    <p className="font-medium">
                      <Balancer>
                        {user && user !== "undefined" ? (
                          <span className="font-mono">{user}</span>
                        ) : (
                          "Your Roblox account"
                        )}{" "}
                        has been denied access to Metrik.
                      </Balancer>
                    </p>
                    <p className="mt-3 text-sm text-neutral-800 dark:text-neutral-400 sm:text-xs">
                      Your studios, projects, and data have all been disabled.
                      Use the Live Chat or email{" "}
                      <Link
                        href="mailto:appeals@metrik.app"
                        className="text-medium text-blue-600"
                      >
                        hey@metrik.app
                      </Link>{" "}
                      for the reason and to appeal.
                      {/* Email{" "}
                      <Link
                        href="mailto:appeals@metrik.app"
                        className="text-medium text-blue-600"
                      >
                        appeals@metrik.app
                      </Link>{" "}
                      for ban reason and to appeal. */}
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

Banned.PageWrapper = PageWrapper;
