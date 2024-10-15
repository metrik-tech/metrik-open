import type { ReactNode } from "react";

export default function PrivacyPolicy({ children }: { children: ReactNode }) {
  return (
    <div className="mb-6">
      <h1 className="mb-2">Security at Metrik</h1>
      <p className="mt-0 text-lg font-medium text-black/60">
        Last updated June 17, 2024
      </p>
      {children}
    </div>
  );
}
