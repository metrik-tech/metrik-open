import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/utils/cn";
import { LoadingDots } from "../loading-dots";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",

  {
    variants: {
      variant: {
        default: cn(
          "bg-blue-500 text-primary-foreground shadow hover:bg-primary/90",

          "border-transparent",

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
          "after:shadow-[shadow:inset_0_1px_theme(colors.white/15%)]",

          // White overlay on hover
          "after:active:bg-white/10 after:hover:bg-white/10",

          // Dark mode: `after` layer expands to cover entire button
          "dark:after:-inset-px dark:after:rounded-lg",

          // Disabled
          "before:disabled:shadow-none after:disabled:shadow-none",
        ),
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: cn(
          // Base
          "border-neutral-950/10 text-neutral-950 data-[active]:bg-neutral-950/[2.5%] data-[hover]:bg-neutral-950/[2.5%]",

          // Dark mode
          "dark:border-white/15 dark:text-white dark:bg-transparent dark:active:bg-white/5 dark:hover:bg-white/5",
        ),

        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const iconVariants = cva("text-neutral-500", {
  variants: {
    size: {
      icon: "w-4 h-4",
      default: "w-4 h-4 mr-1.5",
      sm: "w-3.5 h-3.5 mr-1",
      lg: "w-5 h-5 mr-2",
    },
  },
});

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  icon?: React.ElementType;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading,
      children,
      icon,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    const Icon = icon!;

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {loading ? (
          <span className=" flex items-center animate-in animate-out fade-in-0 fade-out-0">
            <LoadingDots className={cn(iconVariants({ size }))} />
          </span>
        ) : icon ? (
          <span className=" flex items-center animate-out fade-out-0">
            <Icon className={cn(iconVariants({ size }))} />
          </span>
        ) : null}
        {children}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
