import { ArrowLeftIcon } from "@heroicons/react/20/solid";

import { Layout } from "@/components/base-layout";
import { Logo } from "@/components/logo";
import { PageWrapper } from "@/components/page-wrapper";

export default function Error() {
  return (
    <>
      <Layout title="404">
        <div className="flex h-screen flex-col bg-white pb-12 pt-16 dark:bg-dark-tremor-background-muted">
          <main className="mx-auto flex w-full max-w-7xl flex-grow flex-col justify-center px-4 sm:px-6 lg:px-8">
            <div className="flex flex-shrink-0 justify-center">
              <a href="/">
                <Logo className="h-8 w-8" />
              </a>
            </div>
            <div className="py-16 lg:py-28">
              <div className="text-center">
                <p className="text-sm font-semibold uppercase tracking-wide text-blue-500">
                  404 error
                </p>
                <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-5xl">
                  Page not found.
                </h1>
                <p className="mt-2 text-base text-neutral-500">
                  Sorry, we could not find the page you are looking for.
                </p>
                <div className="mt-6 flex justify-center">
                  <a href="/">
                    <span className="group flex items-center justify-start space-x-1 text-base font-medium text-blue-500 transition-all hover:text-blue-400">
                      <span
                        aria-hidden="true"
                        className="mr-1 transition-all group-hover:-translate-x-1"
                      >
                        <ArrowLeftIcon className="h-5 w-5" />
                      </span>
                      Go back home
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </main>
        </div>
      </Layout>
    </>
  );
}

Error.PageWrapper = PageWrapper;
