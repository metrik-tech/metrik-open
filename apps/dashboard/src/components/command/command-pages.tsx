import React from "react";

import {
  Command,
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandShortcut,
} from "../ui/command";
import { usePages } from "./pages";
import { usePageContent } from "./pages-content";

type CommandInputProps = React.ComponentPropsWithoutRef<typeof CommandInput>;
export const Input = (props: CommandInputProps) => {
  const pagesContext = usePages();
  return (
    <CommandInput
      {...props}
      onKeyDown={(event) => {
        if (
          pagesContext.currentPage !== "root" &&
          !!event.currentTarget.value
        ) {
          event.stopPropagation();
        }
      }}
    />
  );
};

type CommandProps = React.ComponentPropsWithoutRef<typeof Command>;
export const Menu = (props: CommandProps) => {
  const pagesContext = usePages();
  const ref = React.useRef<HTMLDivElement | null>(null);

  function bounce() {
    if (ref.current) {
      ref.current.style.transform = "scale(0.96)";
      setTimeout(() => {
        if (ref.current) {
          ref.current.style.transform = "";
        }
      }, 100);
    }
  }

  return (
    <Command
      {...props}
      ref={ref}
      onKeyDown={(event) => {
        if (event.key === "Enter") bounce();

        if (pagesContext.currentPage === "root") return;

        if (event.key === "Backspace") {
          event.preventDefault();
          pagesContext.onPreviousPage();
          bounce();
        }
      }}
    />
  );
};

type ItemElement = React.ElementRef<typeof CommandItem>;
interface ItemProps extends React.ComponentPropsWithoutRef<typeof CommandItem> {
  shortcut?: string;
}
export const Item = React.forwardRef<ItemElement, ItemProps>(
  (props, forwardedRef) => {
    const { children, shortcut, ...itemProps } = props;
    const context = usePages();
    const page = usePageContent();
    const shouldShow = context.currentPage === page;
    return shouldShow ? (
      <CommandItem {...itemProps} ref={forwardedRef}>
        {children}

        {shortcut && <CommandShortcut>{shortcut}</CommandShortcut>}
      </CommandItem>
    ) : null;
  },
);
Item.displayName = "Item";

type GroupElement = React.ComponentRef<typeof CommandGroup>;
type GroupProps = React.ComponentPropsWithoutRef<typeof CommandGroup>;
export const Group = React.forwardRef<GroupElement, GroupProps>(
  (props, forwardedRef) => {
    const context = usePages();
    const page = usePageContent();
    const shouldShow = context.currentPage === page;
    return shouldShow ? (
      <CommandGroup
        {...props}
        title={props.heading as string}
        ref={forwardedRef}
      />
    ) : null;
  },
);
Group.displayName = "Group";

type PageItemTriggerELement = React.ElementRef<typeof Item>;
interface PageItemTriggerProps extends ItemProps {
  page: string;
}
export const PageItemTrigger = React.forwardRef<
  PageItemTriggerELement,
  PageItemTriggerProps
>((props, forwardedRef) => {
  const { page, ...itemProps } = props;
  const context = usePages();
  return (
    <Item
      {...itemProps}
      ref={forwardedRef}
      onSelect={(value) => {
        props.onSelect?.(value);
        context.onNextPage(page);
      }}
    />
  );
});
PageItemTrigger.displayName = "PageItemTrigger";
