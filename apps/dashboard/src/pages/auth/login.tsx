"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Loader2Icon } from "lucide-react";
import { signIn } from "next-auth/react";
import Balancer from "react-wrap-balancer";

import { Background } from "@/components/background";
import { Layout } from "@/components/base-layout";
import { Logo } from "@/components/logo";
import { PageWrapper } from "@/components/page-wrapper";

export default function Login() {
  const router = useRouter();
  const error = router.query.error;
  const redirect = router.query.redirect;
  const [loading, setLoading] = useState(false);

  return (
    <Layout title="Login">
      <Background />
      <div className="flex h-screen w-screen items-center justify-center bg-neutral-50 dark:bg-dark-tremor-background-muted">
        <div className="z-10 w-full max-w-md overflow-hidden rounded-lg border border-neutral-100 shadow-md dark:border-border/50">
          <div className="flex flex-col items-center justify-center space-y-3 border-b border-neutral-200 bg-white px-4 py-6 pt-8 text-center dark:border-border/50 dark:bg-dark-tremor-background sm:px-16">
            <Link href="https://metrik.app">
              <Logo className="h-10 w-10" />
            </Link>
            <h3 className="font-display text-xl font-semibold">Sign In</h3>
            <p className="text-sm text-neutral-500">
              Continue with your Roblox account.
            </p>
          </div>
          <div className="flex flex-col space-y-4 bg-neutral-50 px-4 py-4 dark:bg-dark-tremor-background-subtle">
            {/* <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-neutral-50 px-2 text-neutral-500">
                  Continue with
                </span>
              </div>
            </div> */}

            {error && (
              <div className="inline-flex w-full items-center justify-center rounded-md border border-red-200 bg-red-500/10 px-4 py-2 text-sm text-red-600 dark:border-red-900 dark:text-red-500">
                {error !== "SessionRequired"
                  ? "There was an error signing in. Please try again later."
                  : "You must be signed in to visit that page."}
              </div>
            )}

            <button
              className="inline-flex w-full items-center justify-center rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-500 shadow-sm transition duration-200 dark:border-border dark:bg-dark-tremor-background dark:text-neutral-400 "
              onClick={() => {
                setLoading(true);
                void signIn("roblox", {
                  callbackUrl: redirect?.toString() ?? "/",
                });
              }}
            >
              {loading ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin text-neutral-500 dark:text-neutral-400" />
                </>
              ) : (
                <svg
                  viewBox="0 0 381 379"
                  className="h-4 w-4 text-neutral-500 dark:text-neutral-400"
                  style={{
                    shapeRendering: "geometricPrecision",
                    fillRule: "evenodd",
                    clipRule: "evenodd",
                  }}
                >
                  <g>
                    <path
                      fill="currentColor"
                      d="M 79.5,-0.5 C 82.1667,-0.5 84.8333,-0.5 87.5,-0.5C 184.56,26.4339 281.894,52.7672 379.5,78.5C 353.312,177.9 326.812,277.233 300,376.5C 298.274,377.576 296.441,377.743 294.5,377C 196.779,350.653 99.1123,324.153 1.5,297.5C 0.52368,294.503 0.690347,291.503 2,288.5C 28.025,192.204 53.8583,95.8707 79.5,-0.5 Z M 159.5,136.5 C 187.218,142.964 214.551,150.63 241.5,159.5C 234.144,186.595 226.644,213.595 219,240.5C 192.378,232.678 165.712,225.011 139,217.5C 145.658,190.534 152.492,163.534 159.5,136.5 Z"
                    />
                  </g>
                </svg>
              )}

              <span className="ml-1.5 font-medium" aria-hidden="true">
                Sign in with Roblox
              </span>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

Login.PageWrapper = PageWrapper;
