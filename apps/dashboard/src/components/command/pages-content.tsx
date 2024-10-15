import { createContext, useContext, type ReactNode } from "react";

const PagesContentContext = createContext<string>("root");

type PageProviderProps = {
  page: string;
  children: ReactNode;
};

export const PageContent = ({ page, children }: PageProviderProps) => {
  return (
    <PagesContentContext.Provider value={page}>
      {children}
    </PagesContentContext.Provider>
  );
};

export const usePageContent = () => {
  return useContext(PagesContentContext);
};
