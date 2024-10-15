"use client";

import { Card } from "@tremor/react";
import Balancer from "react-wrap-balancer";

import { Background } from "@/components/background";
import { Layout } from "@/components/base-layout";
import { PageWrapper } from "@/components/page-wrapper";

export default function Preview() {
  return (
    <Layout title="Denied access">
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
                        Access denied. Your account does not have access to the
                        Preview environment.
                      </Balancer>
                    </p>

                    <p className="mt-2 text-sm text-neutral-800 dark:text-neutral-400 sm:text-xs">
                      Please contact support if you were redirected here.
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

Preview.PageWrapper = PageWrapper;
