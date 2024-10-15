"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
} from "react";
import { useRouter } from "next/router";
import { useQueryClient } from "@tanstack/react-query";
import { parse, stringify } from "devalue";
import { useSession } from "next-auth/react";
import { useLocalStorage } from "react-use";
import { toast } from "sonner";
import { create, type StateCreator } from "zustand";
import {
  createJSONStorage,
  persist,
  type PersistOptions,
  type PersistStorage,
  type StorageValue,
} from "zustand/middleware";

import type {
  Membership,
  Project,
  Studio,
  UsageLimits,
} from "@metrik/db/client";

import { api } from "@/utils/api";

interface ExtendedStudio extends Studio {
  projects: Project[];
  membership: Membership[];
}

interface CurrentStudioState {
  currentStudio: ExtendedStudio | undefined;
  setCurrentStudio: (studio: ExtendedStudio | undefined) => void;
}
type StudioPersist = (
  config: StateCreator<CurrentStudioState>,
  options: PersistOptions<CurrentStudioState>,
) => StateCreator<CurrentStudioState>;

interface UseStudio {
  setCurrentStudio: Dispatch<ExtendedStudio>;
  currentStudio: ExtendedStudio | undefined;
  allStudios: ExtendedStudio[];
  usageLimits: UsageLimits | null | undefined;
  isLoading: boolean;
}

const Context = createContext<UseStudio>({} as UseStudio);

const storage: PersistStorage<CurrentStudioState> = {
  getItem: (name): StorageValue<CurrentStudioState> | null => {
    const str = localStorage.getItem(name);
    if (!str) return null;

    const decoded = atob(str);

    return parse(decoded) as StorageValue<CurrentStudioState>;
  },
  setItem: (name, value) => {
    localStorage.setItem(name, btoa(stringify(value)));
  },
  removeItem: (name) => localStorage.removeItem(name),
};

const useCurrentStudio = create<CurrentStudioState>(
  (persist as StudioPersist)(
    (set) => ({
      currentStudio: undefined,
      setCurrentStudio: (studio: ExtendedStudio | undefined) => {
        set({ currentStudio: studio });
      },
    }),
    {
      name: "persisted-studio",
      storage,
      partialize: (state) =>
        ({ currentStudio: state.currentStudio }) as CurrentStudioState,
    },
  ),
);

const Provider = ({ children }: { children: ReactNode }) => {
  const { data: session } = useSession();
  const router = useRouter();

  const queryClient = useQueryClient();

  const { currentStudio, setCurrentStudio: rawSetCurrentStudio } =
    useCurrentStudio();

  const setCurrentStudio = (studio: ExtendedStudio | undefined) => {
    void queryClient.cancelQueries();

    rawSetCurrentStudio(studio);
  };

  const { data: usageLimits } = api.studios.getUsageLimits.useQuery(
    { studioId: currentStudio?.id as string },
    {
      enabled: !!currentStudio,
      staleTime: Infinity,
    },
  );

  const {
    data: allStudios,
    isPending: isLoading,
    error,
    isError,
  } = api.studios.getAll.useQuery();

  useEffect(() => {
    if (allStudios) {
      rawSetCurrentStudio(
        allStudios.find((studio) => studio.id === currentStudio?.id) ??
          allStudios[0],
      );
    }
  }, [allStudios, currentStudio?.id, rawSetCurrentStudio]);

  // useEffect(() => {
  //   if (isError && error?.message) {
  //     if (error.message === "Not onboarded") {
  //       void router.push("/onboarding");
  //       toast(
  //         "You haven't been onboarded! We've redirected you so you can complete the process 🙂",
  //       );

  //       return;
  //     }
  //     toast.error(error.message);
  //   }
  // }, [error?.message, isError, router]);

  return (
    <Context.Provider
      value={{
        isLoading,
        setCurrentStudio,
        currentStudio,
        allStudios: allStudios ?? [],
        usageLimits,
      }}
    >
      {children}
    </Context.Provider>
  );
};

export const useStudio = () => useContext(Context);

export default Provider;
