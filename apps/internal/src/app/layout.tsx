import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import { decode } from "@tsndr/cloudflare-worker-jwt";
import { GeistSans } from "geist/font/sans";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Metrik",
  description: "Automated operations toolkit for Roblox game developers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const store = cookies();
  const token = store.get("CF_Authorization")?.value;

  if (!token) {
    return (
      <html lang="en">
        <body className={`${inter.className}`}>
          <div className="mx-auto max-w-7xl px-4">
            <p>Not logged in</p>
            {children}
          </div>
        </body>
      </html>
    );
  }

  const decoded = decode<{ email: string }>(token);

  return (
    <html lang="en">
      <body className={`${inter.className}`}>
        <div className="mx-auto max-w-7xl px-4">
          <p>Logged in as {decoded?.payload?.email}</p>
          {children}
        </div>
      </body>
    </html>
  );
}
