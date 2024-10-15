import type { ReactNode } from "react";
import { createContext, useContext, useState } from "react";

import type { UsageLimits } from "@metrik/db/client";

import { api } from "@/utils/api";
import { constants } from "@/utils/stripe/constants";
import { useStudio } from "./studio";

interface UseUsageLimits {
  usageLimits:
    | Omit<UsageLimits, "id" | "updatedAt" | "createdAt" | "studioId">
    | null
    | undefined;
  isLoading: boolean;
}

const Context = createContext({} as UseUsageLimits);

const Provider = ({ children }: { children: ReactNode }) => {
  const { currentStudio } = useStudio();

  const {
    isPending: isLoading,
    data: usageLimits,
    isError,
  } = api.studios.getUsageLimits.useQuery(
    {
      studioId: currentStudio?.id as string,
    },
    {
      enabled: !!currentStudio?.id,
    },
  );

  return (
    <Context.Provider
      value={{
        usageLimits: isError ? constants.plans.FREE.usageLimits : usageLimits,
        isLoading,
      }}
    >
      {children}
    </Context.Provider>
  );
};

export const useUsageLimits = () => useContext(Context);

export { Provider as UsageLimitsProvider };
