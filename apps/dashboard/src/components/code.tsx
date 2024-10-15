import "@/styles/code-theme.css";

import { useEffect, type ReactNode } from "react";

import { cn } from "@/utils/cn";

export default function Code({
  children,
  className,
  language,
}: {
  children: ReactNode;
  className?: string;
  language?: "lua" | "json";
}) {
  useEffect(() => {
    const highlight = async () => {
      const Prism = (await import("prismjs")).default;

      // @ts-expect-error: no types
      await import("prismjs/components/prism-lua");
      // @ts-expect-error: no types
      await import("prismjs/components/prism-json");

      Prism.highlightAll();
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    highlight();
  }, [children]);

  return (
    <pre
      className={cn(
        language === "lua" ? "language-lua" : "language-json",
        "!m-0 !rounded-lg",
        className,
      )}
    >
      <code className="!font-mono !text-xs">{children}</code>
    </pre>
  );
}
