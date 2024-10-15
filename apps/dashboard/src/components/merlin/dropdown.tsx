// Tremor Raw Dropdown Menu [v0.0.0]

"use client";

import * as React from "react";
import { CheckIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import * as DropdownMenuPrimitives from "@radix-ui/react-dropdown-menu";
import { RiCheckboxBlankCircleLine, RiRadioButtonFill } from "@remixicon/react";

import { cn } from "@/utils/cn";

const DropdownMenu = DropdownMenuPrimitives.Root;

const DropdownMenuTrigger = DropdownMenuPrimitives.Trigger;

const DropdownMenuGroup = DropdownMenuPrimitives.Group;

const DropdownMenuSubMenu = DropdownMenuPrimitives.Sub;

const DropdownMenuRadioGroup = DropdownMenuPrimitives.RadioGroup;

const DropdownMenuSubMenuTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitives.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitives.SubTrigger>
>(({ className, children, ...props }, forwardedRef) => (
  <DropdownMenuPrimitives.SubTrigger
    ref={forwardedRef}
    className={cn(
      // base
      "relative flex cursor-default select-none items-center rounded py-1.5 pl-2 pr-1 outline-none transition-colors data-[state=checked]:font-semibold sm:text-sm",
      // text color
      "text-neutral-900 dark:text-neutral-50",
      // disabled
      "data-[disabled]:pointer-events-none data-[disabled]:text-neutral-400 data-[disabled]:hover:bg-none dark:data-[disabled]:text-neutral-600",
      // focus
      "focus-visible:bg-neutral-100 data-[state=open]:bg-neutral-100  focus-visible:dark:bg-neutral-900 data-[state=open]:dark:bg-neutral-900",
      // hover
      "hover:bg-neutral-100 hover:dark:bg-neutral-900",
      //
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRightIcon className="ml-auto size-4 shrink-0" aria-hidden="true" />
  </DropdownMenuPrimitives.SubTrigger>
));
DropdownMenuSubMenuTrigger.displayName = "DropdownMenuSubMenuTrigger";

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitives.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitives.SubContent>
>(({ className, collisionPadding = 8, ...props }, forwardedRef) => (
  <DropdownMenuPrimitives.SubContent
    ref={forwardedRef}
    collisionPadding={collisionPadding}
    className={cn(
      // base
      "relative z-50 overflow-hidden rounded-md border p-1 shadow-xl shadow-black/[2.5%]",
      // widths
      "min-w-32",
      // heights
      "max-h-[var(--radix-popper-available-height)]",
      // background color
      "bg-white dark:bg-tremor-dark-background",
      // text color
      "text-neutral-900 dark:text-neutral-50",
      // border color
      "border-neutral-200 dark:border-neutral-800",
      // transition
      "will-change-[transform,opacity]",
      // "data-[state=open]:animate-slideDownAndFade",
      "data-[state=closed]:animate-hide",
      "data-[side=bottom]:animate-slideDownAndFade data-[side=left]:animate-slideLeftAndFade data-[side=right]:animate-slideRightAndFade data-[side=top]:animate-slideUpAndFade",
      className,
    )}
    {...props}
  />
));
DropdownMenuSubContent.displayName = "DropdownMenuSubContent";

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitives.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitives.Content>
>(
  (
    {
      className,
      sideOffset = 8,


      ...props
    },
    forwardedRef,
  ) => (
    <DropdownMenuPrimitives.Portal>
      <DropdownMenuPrimitives.Content
        ref={forwardedRef}
        className={cn(
          // base
          "relative z-50 overflow-hidden rounded-md border p-1 shadow-xl shadow-black/[2.5%]",
          // widths
          "min-w-48",
          // heights
          "max-h-[var(--radix-popper-available-height)]",
          // background color
          "bg-white dark:bg-dark-tremor-background-muted",
          // text color
          "text-neutral-900 dark:text-neutral-50",
          // border color
          "border-neutral-200 dark:border-neutral-800",
          // transition
          "will-change-[transform,opacity]",
          "data-[state=closed]:animate-hide",
          "data-[side=bottom]:animate-slideDownAndFade data-[side=left]:animate-slideLeftAndFade data-[side=right]:animate-slideRightAndFade data-[side=top]:animate-slideUpAndFade",
          className,
        )}
        sideOffset={sideOffset}

        {...props}
      />
    </DropdownMenuPrimitives.Portal>
  ),
);
DropdownMenuContent.displayName = "DropdownMenuContent2";

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitives.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitives.Item> & {
    shortcut?: string;
    hint?: string;
  }
>(({ className, shortcut, hint, ...props }, forwardedRef) => (
  <DropdownMenuPrimitives.Item
    ref={forwardedRef}
    className={cn(
      // base
      "group/DropdownMenuItem relative flex cursor-pointer select-none items-center rounded py-1.5 pl-2 pr-1 outline-none transition-colors data-[state=checked]:font-semibold sm:text-sm",
      // text color
      "text-neutral-900 dark:text-neutral-50",
      // disabled
      "data-[disabled]:pointer-events-none data-[disabled]:text-neutral-400 data-[disabled]:hover:bg-none dark:data-[disabled]:text-neutral-600",
      // focus
      "focus-visible:bg-neutral-100 focus-visible:dark:bg-neutral-800",
      // hover
      "hover:bg-neutral-100 hover:dark:bg-neutral-800",
      className,
    )}
    {...props}
  />
    
  
));
DropdownMenuItem.displayName = "DropdownMenuItem2";

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitives.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitives.CheckboxItem> & {
    shortcut?: string;
    hint?: string;
  }
>(
  (
    { className, hint, shortcut, children, checked, ...props },
    forwardedRef,
  ) => (
    <DropdownMenuPrimitives.CheckboxItem
      ref={forwardedRef}
      className={cn(
        // base
        "relative flex cursor-pointer select-none items-center gap-x-2 rounded py-1.5 pl-8 pr-1 outline-none transition-colors data-[state=checked]:font-semibold sm:text-sm",
        // text color
        "text-neutral-900 dark:text-neutral-50",
        // disabled
        "data-[disabled]:pointer-events-none  data-[disabled]:text-neutral-400 data-[disabled]:hover:bg-none dark:data-[disabled]:text-neutral-600",
        // focus
        "focus-visible:bg-neutral-100 focus-visible:dark:bg-neutral-900",
        // hover
        "hover:bg-neutral-100 hover:dark:bg-neutral-900",
        className,
      )}
      checked={checked}
      {...props}
    >
      <span className="absolute left-2 flex size-4 items-center justify-center">
        <DropdownMenuPrimitives.ItemIndicator>
          <CheckIcon
            aria-hidden="true"
            className="size-full shrink-0 text-neutral-800 dark:text-neutral-200"
          />
        </DropdownMenuPrimitives.ItemIndicator>
      </span>
      {children}
      {hint && (
        <span
          className={cn(
            "ml-auto text-sm font-normal text-neutral-400 dark:text-neutral-600",
          )}
        >
          {hint}
        </span>
      )}
      {shortcut && (
        <span
          className={cn(
            "ml-auto text-sm font-normal tracking-widest text-neutral-400 dark:border-neutral-800 dark:text-neutral-600",
          )}
        >
          {shortcut}
        </span>
      )}
    </DropdownMenuPrimitives.CheckboxItem>
  ),
);
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem";

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitives.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitives.RadioItem> & {
    shortcut?: string;
    hint?: string;
  }
>(({ className, hint, shortcut, children, ...props }, forwardedRef) => (
  <DropdownMenuPrimitives.RadioItem
    ref={forwardedRef}
    className={cn(
      // base
      "group/DropdownMenuRadioItem relative flex cursor-pointer select-none items-center gap-x-2 rounded py-1.5 pl-8 pr-1 outline-none transition-colors data-[state=checked]:font-semibold sm:text-sm",
      // text color
      "text-neutral-900 dark:text-neutral-50",
      // disabled
      "data-[disabled]:pointer-events-none  data-[disabled]:text-neutral-400 data-[disabled]:hover:bg-none dark:data-[disabled]:text-neutral-600",
      // focus
      "focus-visible:bg-neutral-100 focus-visible:dark:bg-neutral-900",
      // hover
      "hover:bg-neutral-100 hover:dark:bg-neutral-900",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex size-4 items-center justify-center">
      <RiRadioButtonFill
        aria-hidden="true"
        className="size-full shrink-0 text-blue-500 group-data-[state=checked]/DropdownMenuRadioItem:flex group-data-[state=unchecked]/DropdownMenuRadioItem:hidden dark:text-blue-500"
      />
      <RiCheckboxBlankCircleLine
        aria-hidden="true"
        className="size-full shrink-0 text-neutral-300 group-data-[state=unchecked]/DropdownMenuRadioItem:flex group-data-[state=checked]/DropdownMenuRadioItem:hidden dark:text-neutral-700"
      />
    </span>
    {children}
    {hint && (
      <span
        className={cn(
          "ml-auto text-sm font-normal text-neutral-400 dark:text-neutral-600",
        )}
      >
        {hint}
      </span>
    )}
    {shortcut && (
      <span
        className={cn(
          "ml-auto text-sm font-normal tracking-widest text-neutral-400 dark:border-neutral-800 dark:text-neutral-600",
        )}
      >
        {shortcut}
      </span>
    )}
  </DropdownMenuPrimitives.RadioItem>
));
DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem";

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitives.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitives.Label>
>(({ className, ...props }, forwardedRef) => (
  <DropdownMenuPrimitives.Label
    ref={forwardedRef}
    className={cn(
      // base
      "px-2 py-2 text-xs font-medium tracking-wide",
      // text color
      " text-neutral-500 dark:text-neutral-500",
      className,
    )}
    {...props}
  />
));
DropdownMenuLabel.displayName = "DropdownMenuLabel";

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitives.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitives.Separator>
>(({ className, ...props }, forwardedRef) => (
  <DropdownMenuPrimitives.Separator
    ref={forwardedRef}
    className={cn(
      "-mx-1 my-1 h-px border-t border-neutral-200 dark:border-neutral-800",
      className,
    )}
    {...props}
  />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

const DropdownMenuIconWrapper = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <div
      className={cn(
        // text color
        "text-neutral-600 dark:text-neutral-400",
        // disabled
        "group-data-[disabled]/DropdownMenuItem:text-neutral-400 group-data-[disabled]/DropdownMenuItem:dark:text-neutral-700",
        className,
      )}
      {...props}
    />
  );
};
DropdownMenuIconWrapper.displayName = "DropdownMenuIconWrapper";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuSubMenuTrigger,
  DropdownMenuSubMenu,
  DropdownMenuSubContent,
  DropdownMenuGroup,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuCheckboxItem,
  DropdownMenuIconWrapper,
  DropdownMenuLabel,
  DropdownMenuSeparator,
};
