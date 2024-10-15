import { useEffect, type ReactNode } from "react";

import "@/styles/gh-light.css";

export function NoLanguageCode({ children }: { children: ReactNode }) {
  useEffect(() => {
    const highlight = async () => {
      const Prism = (await import("prismjs")).default;

      // @ts-expect-error: no types
      await import("prismjs/components/prism-json");
      // @ts-expect-error: no types
      await import("prismjs/plugins/line-numbers/prism-line-numbers.js");

      Prism.highlightAll();
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    highlight();
  }, [children]);

  return (
    <pre className="language-json line-numbers">
      <code className="!font-mono">{children}</code>
    </pre>
  );
}
