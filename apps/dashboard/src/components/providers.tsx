import type { ReactElement, ReactNode } from "react";
import type { AppProps as NextAppProps } from "next/app";
import type { NextRouter } from "next/router";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";

import { env } from "@/env.mjs";
import { api } from "@/utils/api";
import { TooltipProvider } from "./ui/tooltip";

export type WithNonceProps = {
  nonce?: string;
};
//

export type AppProps = Omit<
  NextAppProps<Record<string, unknown>>,
  "Component"
> & {
  Component: NextAppProps["Component"] & {
    getLayout?: (page: ReactElement, router: NextRouter) => ReactNode;
    PageWrapper?: (props: AppProps) => JSX.Element;
  };

  /** Will be defined only is there was an error */
  err?: Error;
};

type AppPropsWithChildren = AppProps & {
  children: ReactNode;
};

export function Providers(props: AppPropsWithChildren) {
  const session = props.pageProps.session as Session | null;

  return (
    <TooltipProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
      >
        <SessionProvider session={session}>
          {/* <IntercomProvider
            autoBoot={process.env.NODE_ENV !== "development"}
            appId={env.NEXT_PUBLIC_INTERCOM_APP_ID}
          > */}
          {props.children}
          {/* </IntercomProvider> */}
        </SessionProvider>
      </ThemeProvider>
    </TooltipProvider>
  );
}
