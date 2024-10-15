"use client";

import { ReactNode } from "react";

export default function DocumentsLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <div className="prose prose-neutral mx-auto mt-16 max-w-3xl px-4 prose-headings:font-semibold">
        {children}
      </div>
    </div>
  );
}
