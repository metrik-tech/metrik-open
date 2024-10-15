import type { ReactNode } from "react";
import classNames from "clsx";

import { cn } from "@/utils/cn";

export interface FooterProps {
  children: ReactNode;
  height?: string;
  paddingX?: string;
}

export const Footer = ({
  height = "h-14",
  paddingX = "px-6",
  children,
}: FooterProps) => {
  return (
    <>
      <div className={cn(height)} />
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 flex w-full items-center border-t",
          height,
          paddingX,
        )}
      >
        {children}
      </div>
    </>
  );
};
