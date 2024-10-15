"use client";

import * as React from "react";
import { forwardRef, useRef } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { CheckIcon, GlobeAmericasIcon } from "@heroicons/react/16/solid";
import {
  ChevronUpDownIcon,
  MoonIcon,
  PlusCircleIcon,
  SquaresPlusIcon,
  SunIcon,
} from "@heroicons/react/20/solid";
import * as Select from "@radix-ui/react-select";
import clsx from "clsx";
import { SunMediumIcon } from "lucide-react";
import type { Session } from "next-auth";
import { useTheme } from "next-themes";

import type { Membership, Project, Studio } from "@metrik/db/client";

import config from "@/utils/config";
import { useProject } from "./hooks/project";
import { useStudio } from "./hooks/studio";
import { JoinStudioModal } from "./join-studio-modal";
import { Logo } from "./logo";
import { StudioAvatar } from "./studio-avatar";
import { Skeleton } from "./ui/skeleton";
import { Dropdown } from "./user-dropdown";

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: "xs" | "sm" | "md";
}

function Avatar({ src, alt = "", size = "md" }: AvatarProps) {
  const sizes = {
    xs: "h-5 w-5",
    sm: "h-6 w-6",
    md: "h-8 w-8",
  }[size];

  return (
    <div
      className={`aspect-square ${sizes} shrink-0 rounded-full border border-neutral-100`}
    ></div>
    // <Image
    //   height={sizes}
    //   width={sizes}
    //   className={`aspect-square shrink-0 rounded-full border border-neutral-100`}
    //   src={src}
    //   alt={alt}
    // />
  );
}

export function DarkModeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      className="relative flex items-center justify-center text-neutral-700 dark:text-neutral-400"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
    >
      <SunIcon className="h-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <MoonIcon className="absolute h-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}

export function StudioSwitcher() {
  const router = useRouter();
  const {
    currentStudio,
    setCurrentStudio,
    allStudios,
    isLoading: isStudioLoading,
  } = useStudio();
  const [open, setOpen] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  const { isLoading } = useProject();

  function handleSetStudio(studioId: string) {
    const newStudio = allStudios.find((s) => s.id === studioId);

    if (newStudio && currentStudio?.id !== studioId) {
      setCurrentStudio(newStudio);

      if (router.pathname !== "/") {
        void router.push("/");
        // window.location.assign("/app");
      }
    }
  }

  if (isStudioLoading || !currentStudio) {
    return (
      <div className="flex items-center py-2 leading-5">
        <div className="inline-flex items-center space-x-3 px-2 leading-5">
          <Skeleton className="aspect-square h-6 w-6 rounded-full" />
          <Skeleton className="h-3 w-[125px]" />
        </div>
      </div>
    );
  }

  if (router.query.studio) {
    const studioId = router.query.studio as string;

    if (studioId !== currentStudio.id) {
      const studio = allStudios.find((s) => s.id === studioId);

      if (studio) {
        setCurrentStudio(studio);
      }
    }
  }

  return (
    <div className="relative z-50">
      <Select.Root
        value={currentStudio.id}
        onValueChange={handleSetStudio}
        open={open}
        onOpenChange={setOpen}
      >
        {!isStudioLoading && currentStudio && (
          <div
            ref={mainRef}
            className="group flex cursor-pointer select-none items-center justify-between text-sm font-medium leading-5 "
          >
            <Link
              className="flex items-center space-x-2 truncate px-2 py-1"
              href="/"
            >
              <span className=" aspect-square shrink-0 rounded-full border">
                <StudioAvatar
                  id={currentStudio.id}
                  url={currentStudio.avatarUrl}
                />
              </span>

              <span className="cursor-pointer truncate font-display text-neutral-800 dark:text-white">
                {currentStudio.name}
              </span>
            </Link>

            <Select.Trigger asChild>
              <button className="ml-2 inline-flex items-center rounded-lg px-1 py-2 opacity-0 transition-all duration-300 hover:bg-neutral-100 group-hover:opacity-100 dark:hover:bg-neutral-800  ">
                <ChevronUpDownIcon className="h-5 w-5 text-neutral-600 dark:text-neutral-500" />
              </button>
            </Select.Trigger>
          </div>
        )}

        <Select.Portal>
          <Select.Content
            className="absolute z-50 mt-2 overflow-hidden truncate rounded-md border border-border/50 bg-white p-1.5 shadow-lg focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:bg-dark-tremor-background"
            position="popper"
            align="start"
            style={{
              marginLeft: mainRef.current ? -mainRef.current.offsetWidth : 0,
              width: mainRef.current ? mainRef.current.offsetWidth + 20 : 0,
            }}
            alignOffset={mainRef.current ? mainRef.current.offsetWidth : 0}
          >
            <Select.Viewport>
              <Select.Group>
                <Select.Label className="my-0.5 ml-2 text-xs text-neutral-500 dark:text-neutral-400">
                  Studios
                </Select.Label>
              </Select.Group>
            </Select.Viewport>

            {!isLoading &&
              allStudios?.map((studio: Studio) => (
                <Select.Item
                  key={studio.id}
                  value={studio.id}
                  className={clsx(
                    "relative flex cursor-pointer select-none items-center truncate rounded-md py-2 pl-2 pr-8 text-neutral-900 hover:bg-neutral-100 focus:outline-none data-[state='checked']:font-medium dark:text-neutral-100 dark:hover:bg-neutral-800",
                  )}
                >
                  <div className="shrink-0 -translate-x-px rounded-full border">
                    <StudioAvatar
                      id={studio.id}
                      size="sm"
                      url={studio.avatarUrl}
                    />
                  </div>

                  <span className="ml-2 mr-1.5 block truncate text-sm">
                    {studio.name.trim()}
                  </span>

                  <Select.ItemIndicator
                    className={clsx(
                      "text-neutral-900 dark:text-neutral-500",
                      "absolute inset-y-0 right-0 flex items-center truncate pr-4",
                    )}
                  >
                    <CheckIcon className="h-5 w-5" aria-hidden="true" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            <div className="relative cursor-pointer select-none rounded-md  text-neutral-900 hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-neutral-800 ">
              <Link
                className="flex h-full w-full items-center py-2 pl-2 pr-8"
                onClick={() => setOpen(false)}
                href="/new/studio"
              >
                <PlusCircleIcon className="aspect-square h-6 w-6 shrink-0 rounded-full text-blue-600" />

                <span
                  className={clsx("font-normal", "ml-2 block truncate text-sm")}
                >
                  Create a new studio
                </span>
              </Link>
            </div>
            <div className="relative cursor-pointer select-none rounded-md text-neutral-900 hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-neutral-800">
              <JoinStudioModal
                trigger={
                  <div className="flex h-full w-full items-center py-2 pl-2 pr-8">
                    <GlobeAmericasIcon className="aspect-square h-6 w-6 shrink-0 rounded-full text-blue-600" />

                    <span className={"ml-2 block truncate text-sm font-normal"}>
                      Join a studio
                    </span>
                  </div>
                }
              />
            </div>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}

interface AppNavbarProps {
  session: Session | null;
  projectId?: string | null;
  studio: boolean | null;
}

export function AppNavbar({
  session,
  studio = true,
  projectId,
}: AppNavbarProps) {
  const { project, isLoading } = useProject();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  return (
    <nav className="mx-auto flex items-center justify-between pt-3 dark:bg-dark-tremor-background">
      <div className="flex items-center space-x-1.5">
        <Link href="/">
          <Logo className="h-6 w-6" />
        </Link>

        <span>
          <svg
            viewBox="0 0 24 24"
            stroke="currentColor"
            className=" h-8 w-8 text-neutral-200 dark:text-neutral-700"
          >
            <path d="M16.88 3.549L7.12 20.451" />
          </svg>
        </span>

        {!studio && (
          <span className="cursor-pointer truncate leading-5">
            User Settings
          </span>
        )}

        {studio && <StudioSwitcher />}
        {studio && project && !isLoading && projectId ? (
          <>
            <span>
              <svg
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="h-8 w-8 text-neutral-200 dark:text-neutral-700"
              >
                <path d="M16.88 3.549L7.12 20.451"></path>
              </svg>
            </span>
            <span className="cursor-pointer truncate text-sm font-medium leading-5">
              {project.name}
            </span>
          </>
        ) : project && isLoading && projectId && studio ? (
          <>
            <span>
              <svg
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="h-8 w-8 text-neutral-200 dark:text-neutral-700"
              >
                <path d="M16.88 3.549L7.12 20.451"></path>
              </svg>
            </span>
            <span className="animate-pulse">
              <div className="h-3.5 w-40 rounded-md bg-neutral-200 dark:bg-neutral-700"></div>
            </span>
          </>
        ) : (
          <></>
        )}
      </div>
      <div className="flex items-center space-x-4">
        <div className="mr-3 hidden items-center space-x-5 md:flex">
          {/* {session && <Feedback />} */}

          <Link
            href={config.feedbackUrl}
            target="_blank"
            className="inline-block text-sm leading-5 text-neutral-500 transition duration-150 ease-in-out "
          >
            Feedback
          </Link>

          <Link
            href={config.docsUrl}
            target="_blank"
            className="inline-block text-sm leading-5 text-neutral-500  transition duration-150 ease-in-out "
          >
            Docs
          </Link>
          <Link
            href={`${config.feedbackUrl}changelog`}
            target="_blank"
            className="inline-block text-sm leading-5 text-neutral-500  transition duration-150 ease-in-out "
          >
            Changelog
          </Link>
        </div>

        <DarkModeSwitcher />

        <div className="shrink-0">
          <Dropdown />
        </div>
      </div>
    </nav>
  );
}
