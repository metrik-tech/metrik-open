import type { NextPageContext } from "next";
import { Inter } from "next/font/google";
import Head from "next/head";

import { Layout } from "@/components/base-layout";

const statusCodes = {
  400: "Bad Request",
  404: "Something is missing",
  405: "Method Not Allowed",
  500: "Internal Server Error",
};

const inter = Inter({
  weight: ["800"],
  subsets: ["latin"],
});

export default function Error({ statusCode }: { statusCode: number }) {
  return (
    <Layout
      title={statusCodes[statusCode as keyof typeof statusCodes] ?? "Error"}
    >
      <section className="flex max-h-screen min-h-screen items-center">
        <div className="mx-auto max-w-screen-xl px-4 lg:px-6">
          <div className="mx-auto max-w-screen-sm text-center">
            <div className={inter.className}>
              <h1 className="mb-4 text-7xl font-extrabold tracking-tighter text-blue-600 text-opacity-95 lg:text-9xl">
                {statusCode}
              </h1>
            </div>

            <p className="mb-4 text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-200 md:text-4xl">
              {statusCodes[statusCode as keyof typeof statusCodes]}.
            </p>
            <p className="mb-4 text-neutral-500 ">
              {statusCode === 500
                ? "We are already working to solve the problem."
                : statusCode === 404
                  ? "Sorry, we can't find that page. You'll find lots to explore on the home page."
                  : "Please try reloading."}
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}

Error.getInitialProps = function getInitialProps({
  res,
  err,
}: NextPageContext) {
  const statusCode = res?.statusCode
    ? res.statusCode
    : err
      ? err.statusCode
      : 404;
  return { statusCode };
};
