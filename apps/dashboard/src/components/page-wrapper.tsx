import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { load } from "@fingerprintjs/fingerprintjs";
import { skipToken, useMutation, useQuery } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { signIn, useSession } from "next-auth/react";
import NextNProgress from "nextjs-progressbar";
import { P } from "node_modules/@upstash/redis/zmscore-22fd48c7";
import { fontFamily } from "tailwindcss/defaultTheme";

import { Providers, type AppProps } from "./providers";
import { Toaster } from "./toaster";

function Lily() {
  const { data } = useSession();

  async function importPublicKey(pem: string) {
    const base64 = pem.replace(
      /-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\\n/g,
      "",
    );

    const binary = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    return await crypto.subtle.importKey(
      "spki",
      binary.buffer as ArrayBuffer,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["encrypt"],
    );
  }

  async function encryptData(publicKey: CryptoKey, data: string) {
    const encoded = new TextEncoder().encode(data);
    const encrypted = await crypto.subtle.encrypt(
      {
        name: "RSA-OAEP",
      },
      publicKey,
      encoded,
    );
    // array buffer to string to console.log

    return Array.from(new Uint8Array(encrypted))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  useQuery({
    queryKey: ["lily"],
    queryFn: data?.user?.lilyToken
      ? async () => {
          async function getFingerprint() {
            const fp = await (await load()).get();
            return fp.visitorId;
          }

          if (!data?.user?.lilyToken) {
            return;
          }

          const chance = Math.random() < 0.5;

          if (!chance) {
            return;
          }

          const body = JSON.stringify({
            fingerprint: await getFingerprint(),
            id: data.user.id,
            hash: data.user.lilyToken,
          });

          const key = await fetch("https://lily.metrik.app/keys").then(
            (res) => res.json() as Promise<string>,
          );

          const publicKey = await importPublicKey(key);

          const encrypted = await encryptData(publicKey, body);

          const res = await fetch("https://lily.metrik.app", {
            method: "POST",
            body: encrypted,
          });

          if (!res.ok) {
            console.log(
              `[LILY] Failed to send security data to Lily with error code ${res.status}`,
            );
          }
        }
      : skipToken,
  });

  return null;
}

// const geistSans = localFont({
//   src: [
//     {
//       path: "../assets/geist/Geist-Thin.woff2",
//       weight: "100",
//       style: "normal",
//     },
//     {
//       path: "../assets/geist/Geist-UltraLight.woff2",
//       weight: "200",
//       style: "normal",
//     },
//     {
//       path: "../assets/geist/Geist-Light.woff2",
//       weight: "300",
//       style: "normal",
//     },
//     {
//       path: "../assets/geist/Geist-Regular.woff2",
//       weight: "400",
//       style: "normal",
//     },
//     {
//       path: "../assets/geist/Geist-Medium.woff2",
//       weight: "500",
//       style: "normal",
//     },
//     {
//       path: "../assets/geist/Geist-SemiBold.woff2",
//       weight: "600",
//       style: "normal",
//     },
//     {
//       path: "../assets/geist/Geist-Bold.woff2",
//       weight: "700",
//       style: "normal",
//     },
//     {
//       path: "../assets/geist/Geist-Black.woff2",
//       weight: "800",
//       style: "normal",
//     },
//     {
//       path: "../assets/geist/Geist-UltraBlack.woff2",
//       weight: "900",
//       style: "normal",
//     },
//   ],
//   variable: "--font-geist-sans",
//   preload: true,
// });

// const inter = Inter({
//   subsets: ["latin"],
//   display: "swap",
//   preload: true,
// });

// const localInter = localFont({
//   src: [
//     {
//       path: "../assets/Inter-Regular.woff2",
//       weight: "400",
//       style: "normal",
//     },
//     {
//       path: "../assets/Inter-Medium.woff2",
//       weight: "500",
//       style: "normal",
//     },
//     {
//       path: "../assets/Inter-SemiBold.woff2",
//       weight: "600",
//       style: "normal",
//     },
//   ],
//   fallback: [
//     "ui-sans-serif",
//     "system-ui",
//     "sans-serif",
//     '"Apple Color Emoji"',
//     '"Segoe UI Emoji"',
//     '"Segoe UI Symbol"',
//     '"Noto Color Emoji"',
//   ],
//   adjustFontFallback: false,
// });

export function PageWrapper(props: AppProps) {
  const { Component, pageProps, router } = props;

  const getLayout = Component.getLayout ?? ((page) => page);

  return (
    <Providers {...props}>
      {/* eslint-disable-next-line react/no-unknown-property */}
      <style jsx global>{`
        [data-theme="dark"] [data-sonner-toast] [data-close-button] {
          background: #1a1a1a !important;
          color: var(--gray1) !important;
          border-color: hsl(0, 0%, 20%) !important;
        }

        [data-sonner-toaster][data-theme="dark"] {
          --normal-bg: #1a1a1a !important;
        }
      `}</style>

      {getLayout(<Component {...pageProps} />, router)}
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
      <Toaster />
      <NextNProgress
        color="#3b82f6"
        height={2}
        showOnShallow={false}
        options={{
          showSpinner: false,
        }}
      />
      <Lily />

      <SpeedInsights />
      <Analytics debug={false} />
    </Providers>
  );
}
