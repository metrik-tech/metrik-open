import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html>
      <Head>
        <link rel="icon" href="/static/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/static/favicon.png" type="image/png" />
        <link
          rel="preload"
          href="/static/Inter-Regular.woff2"
          as="font"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/static/Inter-Medium.woff2"
          as="font"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/static/Inter-SemiBold.woff2"
          as="font"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/static/InterDisplay-SemiBold.woff2"
          as="font"
          crossOrigin="anonymous"
        />
      </Head>
      <body className="font-sans antialiased dark:bg-dark-tremor-background">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
