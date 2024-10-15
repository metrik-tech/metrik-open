"use client";

import { useEffect, useState, type ChangeEvent, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAutoAnimate } from "@formkit/auto-animate/react";
// import { CreateProject } from "@/components/Create/Project";
import {
  MagnifyingGlassIcon,
  PauseCircleIcon,
  PlusIcon,
  UserPlusIcon,
} from "@heroicons/react/16/solid";
import { Flex, Icon, TextInput } from "@tremor/react";

import type { Project } from "@metrik/db/client";

import { AppLayout } from "@/components/app-layout";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Button } from "@/components/merlin/button";
import { PageWrapper } from "@/components/page-wrapper";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMembership } from "@/hooks/membership";
import { useProject } from "@/hooks/project";
import { api } from "@/utils/api";
import { cn } from "@/utils/cn";

export default function BaseApp() {
  const { projects, isLoading } = useProject();
  const [results, setResults] = useState<Project[]>([]);
  const [parent] = useAutoAnimate();
  const router = useRouter();
  const { membership, isLoading: isMembershipLoading } = useMembership();

  useEffect(() => {
    if (projects) {
      setResults(
        projects.sort((a, b) => {
          if (a.paused && !b.paused) return 1;
          if (!a.paused && b.paused) return -1;
          return 0;
        }),
      );
    }
  }, [projects]);

  async function search(event: ChangeEvent<HTMLInputElement>) {
    if (!projects) return;
    if (!event.target.value) return setResults(projects);

    const Fuse = (await import("fuse.js")).default;
    const fuse = new Fuse(projects, {
      keys: ["name", "placeId"],
    });

    const results = fuse
      .search(event.target.value)
      .map((result) => result.item)
      // sort paused to the end
      .sort((a, b) => {
        if (a.paused && !b.paused) return 1;
        if (!a.paused && b.paused) return -1;
        return 0;
      });
    setResults(results);
  }

  return (
    <div>
      <Flex className="mt-6 gap-x-2" justifyContent="between">
        <TextInput
          icon={MagnifyingGlassIcon}
          onChange={(event) => void search(event)}
          className="max-w-full"
          placeholder="Search..."
        />

        {!isMembershipLoading && membership && membership.role !== "USER" && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild size="icon" variant="outline">
                  <Link href="/settings?tab=members">
                    <UserPlusIcon className="h-5 w-5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Manage members</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => void router.push("/new/project")}
                  suffix={PlusIcon}
                >
                  New
                </Button>
              </TooltipTrigger>
              <TooltipContent>Create a new project</TooltipContent>
            </Tooltip>
          </>
        )}
      </Flex>
      {results.length && !isLoading ? (
        <div
          className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2"
          ref={parent}
        >
          {results.map((project: Project) => (
            <Link
              key={project.id}
              href={
                !project.paused
                  ? `/projects/${project.id}/analytics`
                  : `/projects/${project.id}/paused`
              }
              className={cn(
                "relative rounded-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-dark-tremor-background",
              )}
            >
              {project.paused && (
                <div className="absolute inset-0 z-20 h-full w-full overflow-clip rounded-lg">
                  <div className="flex h-full w-full items-center justify-end space-x-1 p-8 font-medium text-neutral-700 dark:text-neutral-200">
                    <PauseCircleIcon className="h-5 w-5" />
                    <p>Project paused</p>
                  </div>
                </div>
              )}
              <div
                className={cn(
                  "group cursor-pointer rounded-lg border bg-white p-8 shadow ring-neutral-300  transition-all ease-in-out hover:shadow-lg dark:bg-dark-tremor-background hover:dark:bg-neutral-900",
                  project.paused && "opacity-70",
                )}
              >
                {/* <Image
                alt={`${project.name}'s icon`}
                src={`https://api.dicebear.com/5.x/initials/png?backgroundType=gradientLinear&scale=80&seed=${encodeURI(
                  project.name
                )}`}
                
                width="40"
                height="40"
                className="rounded-full"
              /> */}

                <div className="flex flex-shrink-0 flex-row gap-2 ">
                  <Image
                    height={48}
                    width={48}
                    src={`https://thumbs.metrik.app/game/${
                      project.universeId || "123456"
                    }`}
                    alt={`${project.name}'s Roblox icon`}
                    className="inline-flex rounded-lg"
                  />
                  <span className="truncate font-display font-medium transition ease-in-out">
                    {project.name}
                    <br />
                    <pre className="truncate font-mono text-xs text-neutral-500 transition ease-in-out ">
                      {project.placeId}
                    </pre>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : !isLoading ? (
        <div className="mt-6 flex h-[26rem] items-center justify-center rounded-xl border-2 border-dashed">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-neutral-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="mt-2 font-medium text-neutral-900">No projects</h3>
            <p className="mt-1 text-sm text-neutral-500">
              Get started by creating a new project.
            </p>
            <div className="mt-6">
              <Button
                suffix={PlusIcon}
                onClick={() => void router.push("/new/project")}
              >
                New Project
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex h-[26rem] items-center justify-center">
          <LoadingSpinner />
        </div>
      )}

      {/* <CreateProject isOpen={createOpen} setIsOpen={setCreateOpen} /> */}
    </div>
  );
}
BaseApp.PageWrapper = PageWrapper;

BaseApp.getLayout = (page: ReactNode) => {
  return <AppLayout tab="projects">{page}</AppLayout>;
};
