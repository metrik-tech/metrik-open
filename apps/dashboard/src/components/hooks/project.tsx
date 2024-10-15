"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { toast } from "sonner";
import superjson from "superjson";
import { useLocalStorage } from "usehooks-ts";
import { create } from "zustand";

import type { Project, Studio } from "@metrik/db/client";

import { api } from "@/utils/api";
import { useStudio } from "./studio";

interface UseProject {
  projects: Project[] | null | undefined;
  project: Project | null | undefined;
  isLoading: boolean;
  recentProjects: Project[];
}

interface UseRecentProjects {
  projects: Project[];
}

const useRecentProjects = create<UseRecentProjects>((set) => ({
  projects: [],
}));

const Context = createContext<UseProject>({} as UseProject);

const Provider = ({ children, id }: { children: ReactNode; id?: string }) => {
  // const [queryClient] = useState(() => new QueryClient());
  // const [trpcClient, setTrpcClient] = useState(() =>
  //   aurora.createClient({
  //     links: [
  //       httpBatchLink({
  //         transformer: superjson,
  //         url: "http://localhost:3000/trpc",
  //         // You can pass any HTTP headers you wish here
  //         headers() {
  //           return {
  //             authorization: "b",
  //           };
  //         },
  //       }),
  //     ],
  //   }),
  // );
  const router = useRouter();
  const [recentProjects, setRecentProjects] = useLocalStorage<Project[]>(
    "recentProjects",
    [],
    {
      initializeWithValue: false,
    },
  );

  const { currentStudio, isLoading: isStudioLoading } = useStudio();

  const {
    isPending: projectIsLoading,
    data: project,
    isError,
    error,
  } = api.projects.get.useQuery(
    {
      id: id as string,
    },
    {
      refetchOnMount: true,
      enabled: !!id,

      // onSuccess: (data) => {
      //   if (!data) return;
      //   setRecentProjects((prev) => {
      //     // max of 3 recent projects
      //     if (
      //       prev.length >= 3 &&
      //       !prev.find((project) => project.id === data.id)
      //     ) {
      //       prev.pop();
      //     }

      //     if (prev.find((project) => project.id === data.id)) {
      //       const index = prev.findIndex((project) => project.id === data.id);

      //       prev.splice(index, 1);

      //       prev.unshift(data);

      //       return prev;
      //     }

      //     prev.unshift(data);
      //     return prev;
      //   });
      // },
    },
  );

  useEffect(() => {
    if (project) {
      setRecentProjects((prev) => {
        // max of 3 recent projects
        if (
          prev.length >= 3 &&
          !prev.find((prevProject) => prevProject.id === project.id)
        ) {
          prev.pop();
        }
        if (prev.find((prevProject) => prevProject.id === project.id)) {
          const index = prev.findIndex((project) => project.id === project.id);
          prev.splice(index, 1);
          prev.unshift(project);
          return prev;
        }
        prev.unshift(project);
        return prev;
      });
    }
  }, [project, setRecentProjects]);

  useEffect(() => {
    if (isError) {
      void router.push("/");
      toast.error(error.message);
    }
  }, [error?.message, isError, router]);

  // useEffect(() => {
  //   if (project) {
  //     setTrpcClient(
  //       aurora.createClient({
  //         links: [
  //           httpBatchLink({
  //             transformer: superjson,
  //             url: process.env.NEXT_PUBLIC_VERCEL
  //               ? "https://api.metrik.app/api/trpc"
  //               : "http://localhost:3001/api/trpc",
  //             // You can pass any HTTP headers you wish here
  //             async headers() {
  //               return {
  //                 authorization: await getToken(),
  //                 "x-project-id": project.id,
  //               };
  //             },
  //           }),
  //         ],
  //       }),
  //     );
  //   }
  // }, [project]);

  useEffect(() => {
    if (project?.paused) {
      void router.push(`/projects/${project.id}/paused`);
    }
  }, [project, router]);

  const isLoading = !id ? isStudioLoading : projectIsLoading;

  return (
    <Context.Provider
      value={{
        project,
        isLoading,
        projects: currentStudio?.projects,
        recentProjects,
      }}
    >
      {/* <aurora.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}> */}
      {children}
      {/* </QueryClientProvider>
      </aurora.Provider> */}
    </Context.Provider>
  );
};

// async function getToken() {
//   const token = (await fetch("/api/token", {
//     credentials: "include",
//   }).then((res) => res.json())) as string;

//   return `Bearer ${token}`;
// }

export const useProject = () => useContext(Context);

export default Provider;
