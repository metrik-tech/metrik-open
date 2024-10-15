"use client";

import React from "react";
import { type ButtonProps as HeadlessButtonProps } from "@headlessui/react";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/utils/cn";
import { LoadingDots } from "../loading-dots";

const buttonVariants = cva(
  cn(
    "relative isolate inline-flex items-center justify-center rounded-lg border font-medium whitespace-nowrap",
    "focus:outline-none data-[focus]:outline data-[focus]:outline-2 data-[focus]:outline-offset-2 data-[focus]:outline-blue-500 cursor-pointer",
  ),
  {
    variants: {
      variant: {
        solid: cn(
          // Optical border, implemented as the button background to avoid corner artifacts
          "border-transparent bg-blue-500",

          // Dark mode: border is rendered on `after` so background is set to button background
          "dark:bg-blue-500",

          // Button background, implemented as foreground layer to stack on top of pseudo-border layer
          "before:absolute before:inset-0 before:-z-10 before:rounded-lg before:bg-blue-500",

          // Drop shadow, applied to the inset `before` layer so it blends with the border
          "before:shadow",

          // Background color is moved to control and shadow is removed in dark mode so hide `before` pseudo
          "dark:before:hidden",

          // Dark mode: Subtle white outline is applied using a border
          "dark:border-white/5",

          // Shim/overlay, inset to match button foreground and used for hover state + highlight shadow
          "after:absolute after:inset-0 after:-z-10 after:rounded-lg",

          // Inner highlight shadow
          "after:shadow-[shadow:inset_0_1.3px_theme(colors.white/15%)]",

          // White overlay on hover
          "after:data-[active]:bg-blue-950/30 after:hover:bg-blue-950/30",

          // Dark mode: `after` layer expands to cover entire button
          "dark:after:-inset-px dark:after:rounded-lg",

          "text-white",
        ),
        destructive: cn(
          // Optical border, implemented as the button background to avoid corner artifacts
          "border-transparent bg-red-500",

          // Dark mode: border is rendered on `after` so background is set to button background
          "dark:bg-red-500",

          // Button background, implemented as foreground layer to stack on top of pseudo-border layer
          "before:absolute before:inset-0 before:-z-10 before:rounded-lg before:bg-red-500",

          // Drop shadow, applied to the inset `before` layer so it blends with the border
          "before:shadow",

          // Background color is moved to control and shadow is removed in dark mode so hide `before` pseudo
          "dark:before:hidden",

          // Dark mode: Subtle white outline is applied using a border
          "dark:border-white/5",

          // Shim/overlay, inset to match button foreground and used for hover state + highlight shadow
          "after:absolute after:inset-0 after:-z-10 after:rounded-lg",

          // Inner highlight shadow
          "after:shadow-[shadow:inset_0_1.3px_theme(colors.white/15%)]",

          // White overlay on hover
          "after:data-[active]:bg-red-950/30 after:hover:bg-red-950/30",

          // Dark mode: `after` layer expands to cover entire button
          "dark:after:-inset-px dark:after:rounded-lg",

          "text-white",
        ),
        outline: cn(
          // Base
          "border-border text-neutral-950 data-[active]:bg-neutral-950/[2.5%] hover:bg-neutral-950/[2.5%] bg-white shadow-sm",

          // "before:absolute before:inset-0 before:-z-10 before:rounded-md before:bg-white dark:before:bg-dark-tremor-background",

          // Dark mode
          "dark:text-white dark:bg-dark-tremor-background dark:data-[active]:bg-white/5 dark:hover:bg-white/5",
        ),
        ghost: cn(
          // Base
          "border-transparent text-blue-500 data-[active]:bg-neutral-950/5 data-[active]:bg-neutral-950/5",

          // Dark mode
          "hover:bg-neutral-950/5 dark:data-[active]:bg-white/10 dark:data-[active]:bg-white/10 dark:data-[hover]:bg-white/10",

          // Icon
          "",
        ),
      },
      loading: {
        true: "cursor-not-allowed",
        false: "",
      },
      disabled: {
        true: "cursor-not-allowed",
        false: "",
      },
      size: {
        sm: "px-3 py-1 gap-x-1.5 text-sm/6",
        md: "px-4 py-1.5 gap-x-2 text-sm/6",
        lg: "px-12 py-3 gap-x-2 text-base/6",
        icon: "p-2  text-sm/6",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "solid",
      loading: false,
      disabled: false,
      size: "md",
    },
    compoundVariants: [
      {
        disabled: true,
        variant: ["solid", "destructive"],
        class:
          "bg-neutral-200 dark:bg-neutral-900 dark:text-neutral-400 border-neutral-300 text-neutral-500 cursor-not-allowed before:bg-transparent before:shadow-none after:shadow-none after:hover:bg-transparent",
      },
      {
        disabled: true,
        variant: "outline",
        class:
          "border-neutral-300 text-neutral-500 cursor-not-allowed before:bg-transparent before:shadow-none after:shadow-none hover:bg-transparent",
      },
      {
        loading: true,
        variant: ["solid", "destructive"],
        class: "after:hover:bg-transparent",
      },
    ],
  },
);

const loadingVariants = cva("", {
  variants: {
    variant: {
      solid: "*:bg-white",
      destructive: "*:bg-white",
      outline: "*:bg-neutral-600",
      ghost: "*:bg-blue-500",
    },
    size: {
      sm: "*:size-3.5",
      md: "*:size-4",
      lg: "",
      icon: "*:size-4",
    },
    disabled: {
      true: "",
      false: "",
    },
  },
  compoundVariants: [
    {
      disabled: true,
      class: "*:bg-neutral-500 *:dark:bg-neutral-400",
    },
  ],
  defaultVariants: {
    variant: "solid",
    size: "md",
    disabled: false,
  },
});

const iconVariants = cva("shrink-0", {
  variants: {
    variant: {
      solid: "text-white",
      destructive: "text-white",
      outline: "text-neutral-400",
      ghost: "text-blue-500",
    },
    position: {
      left: "",
      right: "",
    },
    size: {
      sm: "size-4",
      md: "size-[18px]",
      lg: "size-5",
      icon: "size-4",
    },
  },
  compoundVariants: [],
  defaultVariants: {
    variant: "solid",
    position: "left",
    size: "md",
  },
});

type ButtonProps = {
  children: React.ReactNode;
  asChild?: boolean;
  prefix?: React.ComponentType<{ className?: string }>;
  suffix?: React.ComponentType<{ className?: string }>;
} & VariantProps<typeof buttonVariants> &
  Omit<HeadlessButtonProps, "prefix" | "suffix">;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      color,
      className,
      children,
      loading,
      variant,
      size,
      fullWidth,
      prefix: Prefix,
      suffix: Suffix,
      disabled,
      asChild,
      ...props
    }: ButtonProps,
    ref: React.ForwardedRef<HTMLButtonElement>,
  ) {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        {...props}
        className={cn(
          buttonVariants({ size, variant, disabled, loading, fullWidth }),
          className,
        )}
        ref={ref}
        disabled={!!disabled || !!loading}
      >
        {/* TODO: Add back TouchTarget. Removed because radix slot does not work with nested slottables */}
        {loading && !Suffix && (
          <LoadingDots
            className={cn(loadingVariants({ size, variant, disabled }))}
          />
        )}
        {!loading && Prefix && (
          <Prefix
            className={iconVariants({ variant, size, position: "left" })}
          />
        )}
        <Slottable>{children}</Slottable>
        {Suffix && !loading && (
          <Suffix
            className={iconVariants({ variant, size, position: "right" })}
          />
        )}

        {loading && Suffix && (
          <LoadingDots
            className={cn(loadingVariants({ size, variant, disabled }))}
          />
        )}
      </Comp>
    );
  },
);

/* Expand the hit area to at least 44×44px on touch devices */
export function TouchTarget({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <span
        className="absolute left-1/2 top-1/2 size-[max(100%,2.75rem)] -translate-x-1/2 -translate-y-1/2 [@media(pointer:fine)]:hidden"
        aria-hidden="true"
      />
    </>
  );
}
