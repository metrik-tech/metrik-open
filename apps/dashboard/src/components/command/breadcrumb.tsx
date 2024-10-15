import React from "react";
import ReactDOM from "react-dom";

import { usePages } from "./pages";
import { usePageContent } from "./pages-content";

type BreadcrumbElement = HTMLOListElement | null;
type ContextValue = [BreadcrumbElement, (element: BreadcrumbElement) => void];

const Context = React.createContext<ContextValue | undefined>(undefined);

const useBreadcrumbContext = () => {
  const context = React.useContext(Context);

  if (!context) {
    throw new Error("Missing BreadcrumbProvider.");
  }

  return context;
};

type BreadcrumbProviderProps = {
  children: React.ReactNode;
};
const BreadcrumbsProvider = ({ children }: BreadcrumbProviderProps) => {
  const portalNodeState = React.useState<HTMLOListElement | null>(null);
  return (
    <Context.Provider value={portalNodeState}>{children}</Context.Provider>
  );
};

const BreadcrumbsViewport = () => {
  const [, setPortalNode] = useBreadcrumbContext();
  return (
    <nav aria-label="Breadcrumb">
      <ol ref={setPortalNode} />
    </nav>
  );
};

type BreadcrumbProps = {
  children: React.ReactNode;
};
const BreadcrumbsItem = ({ children, ...props }: BreadcrumbProps) => {
  const [portalNode] = useBreadcrumbContext();
  const pageContext = usePages();
  const page = usePageContent();
  return pageContext.pages.includes(page) && portalNode
    ? ReactDOM.createPortal(
        <li style={{ all: "unset" }}>
          <button
            {...props}
            className="font-neutral-400 my-1 ml-1 inline-flex h-5 select-none items-center rounded-[4px] bg-background px-2 text-xs font-medium capitalize"
            onClick={() => pageContext.onPageChange(page)}
          >
            {children}
          </button>
        </li>,
        portalNode,
      )
    : null;
};

export const Breadcrumbs = Object.assign(BreadcrumbsProvider, {
  Viewport: BreadcrumbsViewport,
  Item: BreadcrumbsItem,
});
