"use client";

import Link from "next/link";
import { Card } from "@tremor/react";

import { Background } from "@/components/background";
import { Layout } from "@/components/base-layout";
import { PageWrapper } from "@/components/page-wrapper";
import config from "@/utils/config";

export default function Waitlist() {
  return (
    <Layout title="You are on the waitlist">
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
                      You do not have access to Metrik.
                    </p>
                    <p className="mt-2 text-sm text-neutral-800 dark:text-neutral-400 sm:text-xs">
                      We are slowly onboarding people from our waitlist. If
                      you&apos;d like to skip the line and gain access sooner,
                      please join our{" "}
                      <Link
                        href={config.discordServer}
                        className="text-blue-600"
                      >
                        Discord community
                      </Link>
                      .
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

Waitlist.PageWrapper = PageWrapper;
