"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import type {
  Membership,
  MembershipRole,
  Project,
  Studio,
} from "@metrik/db/client";

import { api } from "@/utils/api";
import { useStudio } from "./studio";

interface UseMembership {
  membership: Membership | null | undefined;
  isLoading: boolean;
  isUser: boolean;
  isOwner: boolean;
  isAdmin: boolean;
}

const Context = createContext<UseMembership>({} as UseMembership);

const Provider = ({ children }: { children: ReactNode }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const { currentStudio, isLoading: isStudioLoading, allStudios } = useStudio();

  const {
    isPending: membershipIsLoading,
    data: membership,
    isError,
    error,
  } = api.membership.getMember.useQuery(
    {
      studioId: currentStudio?.id as string,
    },
    {
      refetchOnMount: true,
      enabled: !!currentStudio?.id,
    },
  );

  const isOwner = membership?.role === "OWNER";
  const isAdmin = membership?.role === "ADMIN" || membership?.role === "OWNER";
  const isUser = membership?.role === "USER";

  // useEffect(() => {
  //   if (membership && session) {
  //     update({
  //       name: session.user.name!,
  //       userId: session.user.id,
  //       userHash: session.user.intercomHash,
  //       avatar: {
  //         type: "avatar",
  //         imageUrl: `https://thumbs.metrik.app/headshot/${
  //           session.user.robloxId || 1
  //         }/150`,
  //       },
  //     });
  //   }
  // }, [membership, session, update]);

  useEffect(() => {
    if (isError) {
      if (error.message !== "Not onboarded") {
        toast.error(`Membership Error`, {
          description: error.message,
        });
      }
    }
  }, [isError, error?.message]);

  // const isProjectLoading = queryIsLoading || !!id;
  const isLoading = membershipIsLoading || isStudioLoading;

  return (
    <Context.Provider
      value={{ isLoading, membership, isUser, isOwner, isAdmin }}
    >
      {children}
    </Context.Provider>
  );
};

export const useMembership = () => useContext(Context);

export default Provider;
