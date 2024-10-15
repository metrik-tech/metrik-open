import type { ReactElement } from "react";
import Head from "next/head";

import config from "@/utils/config";

interface LayoutProps {
  title?: string;
  description?: string;
  children: ReactElement | ReactElement[];
  className?: string;
}

export function Layout({
  title,
  description = "Automated LiveOps toolkit for Roblox",
  children,
  className,
}: LayoutProps) {
  return (
    <>
      <Head>
        <title>{title ? `Metrik - ${title}` : "Metrik"}</title>
        <link rel="icon" type="image/svg+xml" href="/static/favicon.svg" />
        <link rel="icon" href="/static/favicon.png" type="image/png"></link>
        <meta
          name="og:image"
          content={`${config.baseUrl()}/api/og${
            title ? `?title=${encodeURIComponent(title)}` : ""
          }`}
        />
        {description ? (
          <>
            <meta name="description" content={description} />
            <meta name="og:description" content={description} />
          </>
        ) : (
          <>
            <meta name="description" content={config.tagline} />
            <meta name="og:description" content={config.tagline} />
          </>
        )}
        <meta httpEquiv="Content-Language" content="en" />

        <meta
          name="og:title"
          content={title ? title + " — Metrik" : "Metrik"}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        <meta name="twitter:card" content="summary_large_image" />

        <meta
          name="twitter:image"
          content={`${config.baseUrl()}/api/og${
            title ? `?title=${encodeURIComponent(title)}` : ""
          }`}
        />
        <meta
          name="og:title"
          content="Metrik: Automated toolkit for Roblox developers"
        />
      </Head>
      <div className={className}>{children}</div>
    </>
  );
}
