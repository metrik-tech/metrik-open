import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type PageContextValue = {
  pages: string[];
  currentPage: string;
  onNextPage: (page: string) => void;
  onPreviousPage: () => void;
  onPageChange: (page: string) => void;
};

//

const PageContext = createContext<PageContextValue | undefined>(undefined);

type ProviderProps = {
  children: ReactNode;
};

export const Pages = ({ children }: ProviderProps) => {
  const [pages, setPages] = useState<string[]>(["root"]);
  const currentPage = pages[pages.length - 1];

  const handleNextPage = useCallback((page: string) => {
    return setPages((currentPages) => [...currentPages, page]);
  }, []);

  const handlePreviousPage = useCallback(() => {
    if (currentPage !== "root") {
      setPages((currentPages) => currentPages.slice(0, -1));
    }
  }, [currentPage]);

  const handlePageChange = useCallback((page: string) => {
    setPages((pages) => {
      const newPages = [...pages];
      newPages.splice(pages.indexOf(page) + 1, pages.length);
      return newPages;
    });
  }, []);

  const value = useMemo(
    () => ({
      pages,
      currentPage: currentPage as string,
      onNextPage: handleNextPage,
      onPreviousPage: handlePreviousPage,
      onPageChange: handlePageChange,
    }),
    [pages, currentPage, handleNextPage, handlePreviousPage, handlePageChange],
  );

  return <PageContext.Provider value={value}>{children}</PageContext.Provider>;
};

export const usePages = () => {
  const context = useContext(PageContext);
  if (!context) {
    throw new Error("usePages must be used within PagesProvider");
  }
  return context;
};
