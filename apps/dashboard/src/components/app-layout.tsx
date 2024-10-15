"use client";

import {
  forwardRef,
  ReactElement,
  useEffect,
  useRef,
  useState,
  type HTMLAttributeAnchorTarget,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  ArrowRightIcon,
  ExclamationTriangleIcon,
  LinkIcon,
} from "@heroicons/react/16/solid";
import {
  BookOpenIcon,
  BugAntIcon,
  ChevronRightIcon,
  CodeBracketSquareIcon,
  Cog6ToothIcon,
  FlagIcon,
  HomeIcon,
  LifebuoyIcon,
  MegaphoneIcon,
  ServerStackIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
} from "@heroicons/react/20/solid";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Badge,
  Button,
  Card,
  Flex,
  Tab,
  TabGroup,
  TabList,
} from "@tremor/react";
import clsx from "clsx";
import { formatDuration, intervalToDuration } from "date-fns";
import {
  AtomIcon,
  BarChartIcon,
  CogIcon,
  CornerDownRightIcon,
  LayoutGridIcon,
  MenuIcon,
  ScrollIcon,
  ShieldIcon,
  X,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { useMedia } from "react-use";
import { toast } from "sonner";
import { useEventListener } from "usehooks-ts";

import { Plan } from "@metrik/db/client";

import { api } from "@/utils/api";
import { cn } from "@/utils/cn";
import config from "@/utils/config";
import getStripe from "@/utils/stripejs";
import { AppNavbar, DarkModeSwitcher, StudioSwitcher } from "./app-navbar";
import { Layout } from "./base-layout";
import { Pages } from "./command/pages";
import MembershipProvider, { useMembership } from "./hooks/membership";
import ProjectProvider, { useProject } from "./hooks/project";
import StudioProvider, { useStudio } from "./hooks/studio";
import { UsageLimitsProvider } from "./hooks/usage-limits";
import { Logo } from "./logo";
import { Main } from "./main";
import { Button as MerlinButton } from "./merlin/button";
import { Skeleton } from "./ui/skeleton";
import { Dropdown } from "./user-dropdown";

// const Status = dynamic(() => import("@/components/status"), {
//   ssr: false,
// });

interface AppLayoutProps {
  children: ReactNode | ReactNode[];
  project?: boolean;
  projectId?: string;
  title?: string;
  tab: string;
  whiteBg?: boolean;
  subContent?: ReactNode;
  subTab?: {
    name: string;
    href: string;
  };
}

const projectTabs = [
  {
    name: "Overview",
    icon: HomeIcon,
    slug: "analytics",
    description: "A quick overview of your project's activity.",
  },
  {
    name: "Servers",
    icon: ServerStackIcon,
    slug: "servers",
    description: "View and control your game servers.",
  },
  {
    name: "Actions",
    icon: CodeBracketSquareIcon,
    slug: "actions",

    description: "Easily trigger functions in your experience.",
  },

  {
    name: "Flags",
    icon: FlagIcon,
    slug: "flags",
    description: "Keep track of errors and in your game's code.",
  },
  {
    name: "Issues",
    icon: BugAntIcon,
    slug: "logs",
    description: "Keep track of errors and in your game's code.",
  },
  // {
  //   name: "Moderation",
  //   icon: ShieldCheckIcon,
  //   slug: "moderation",
  //   description: "Keep your experience safe from bad actors.",
  // },
  {
    name: "Broadcasts",
    icon: MegaphoneIcon,
    slug: "broadcasts",
    description: "Send messages to your players.",
  },
  {
    name: "Project Settings",
    icon: Cog6ToothIcon,
    slug: "settings",
    description: "Customize your project to your liking.",
  },
] as const;

const studioTabs = [
  {
    name: "Projects",
    icon: Squares2X2Icon,
    slug: "projects",
    href: "",
    description: "Containers for an experience's activity on Metrik.",
  },
  {
    name: "Studio Settings",
    icon: Cog6ToothIcon,
    slug: "studiosettings",
    href: "settings",
    description: "Edit your studio and manage billing & membership.",
  },
] as const;

function Sidebar({
  project,
  projectName,
  tab,
  projectId,
}: {
  project: boolean;
  projectName?: string;
  tab: string;
  projectId: string;
}) {
  const {
    project: currentProject,
    isLoading: isProjectLoading,
    recentProjects,
  } = useProject();
  const { currentStudio, isLoading: isStudioLoading } = useStudio();
  const router = useRouter();

  return (
    <aside className="fixed inset-y-0 z-10 hidden h-full w-64 flex-col justify-between border-neutral-200  bg-white px-6 dark:border-border dark:bg-dark-tremor-background md:flex">
      <div>
        {/* <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center justify-start space-x-2">
          <Link href="/">
            <Logo className="h-5 w-5" />
          </Link>
          {(process.env.NODE_ENV === "development" ||
            process.env.VERCEL_ENV === "preview") && (
            <span className="text-lg font-semibold opacity-100">Preview</span>
          )}
        </div>
        <DarkModeSwitcher />
      </div> */}
        <div className="-mx-2 mt-[22px]">
          <StudioSwitcher />
        </div>

        {!project && (
          <div className="mt-6">
            {/* <h2 className="text-content text-xs font-semibold leading-6 text-neutral-600 dark:text-neutral-400">
              Studio
            </h2> */}

            <ul className="-mx-2 flex flex-col space-y-1">
              <SidebarTab
                key={"projects"}
                name={"Projects"}
                icon={Squares2X2Icon}
                href={"/"}
                active={tab === "projects"}
              />
              {/* {currentStudio && !isStudioLoading && (
            <div className="">
              {currentStudio.projects.slice(0, 3).map((project) => (
                <div className="relative w-full" key={project.id}>
                  <CornerDownRightIcon className="absolute inset-y-0 left-0 aspect-square h-4 w-4 flex-shrink-0 pl-4 text-neutral-500 dark:text-neutral-400" />
                  <div className="w-full flex-shrink pl-4">
                    <SidebarTab
                      name={project.name}
                      icon={BarChartIcon}
                      href={`/projects/${project.id}/analytics`}
                      active={false}
                    />
                  </div>
                </div>
              ))}
            </div>
          )} */}

              {studioTabs
                .filter((v) => v.slug !== "projects")
                .map((studioTab) => (
                  <SidebarTab
                    key={studioTab.name}
                    name={studioTab.name}
                    icon={studioTab.icon}
                    href={"/settings"}
                    active={tab === studioTab.slug}
                  />
                ))}
            </ul>
          </div>
        )}

        {project && (
          <div className="mt-6">
            {/* {currentProject && !isProjectLoading ? (
              <h2 className="text-ellipsis text-xs font-semibold leading-6 text-neutral-600 dark:text-neutral-400">
                {currentProject.name}
              </h2>
            ) : (
              <h2 className="text-ellipsis text-xs font-semibold leading-6 text-neutral-600 dark:text-neutral-400">
                {"..."}
              </h2>
            )} */}
            <ul className="-mx-2 flex flex-col space-y-1">
              {projectTabs.map((projectTab) => (
                <SidebarTab
                  key={projectTab.name}
                  name={projectTab.name}
                  icon={projectTab.icon}
                  href={`/projects/${projectId}/${projectTab.slug}`}
                  active={tab === projectTab.slug}
                />
              ))}
            </ul>
          </div>
        )}
      </div>
      <div>
        <OpenCloudErrorAlert />
        <NoDataAlert />
        <ul className="-mx-2 flex flex-col space-y-1 pb-4">
          <SidebarTab
            name="Documentation"
            icon={BookOpenIcon}
            href="https://docs.metrik.app"
            active={false}
            target="_blank"
          />
          <SidebarTab
            name="Support Server"
            icon={LifebuoyIcon}
            href="https://l.metrik.app/discord"
            active={false}
            target="_blank"
          />
        </ul>
      </div>
    </aside>
  );
}

function NoDataAlert() {
  const { project } = useProject();

  const { data } = api.commands.getNoSDKDetection.useQuery(
    {
      projectId: project?.id as string,
    },
    {
      enabled: !!project?.id,
    },
  );

  if (data && project?.id && !project?.openCloudError) {
    return (
      <div className="-mx-2 mb-4 rounded-lg border border-amber-400 bg-amber-400/10 p-3">
        <div className="flex items-center justify-start gap-x-1">
          <ExclamationTriangleIcon className="h-4 w-4 font-medium text-amber-800 dark:text-amber-500" />
          <span className="text-sm font-medium text-amber-800 dark:text-amber-500">
            Alert
          </span>
        </div>
        <p className="mt-1 text-[13px] text-amber-800 dark:text-amber-500">
          Metrik has not received any data from your game in 14 days. There
          could be an issue with the installation of the SDK.
        </p>
        <Link
          href="https://docs.metrik.app/troubleshooting#no-data"
          className="mt-2 flex items-center justify-start gap-x-1 text-sm font-medium text-amber-800"
          target="_blank"
        >
          <span>Learn more</span> <ArrowRightIcon className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  return null;
}

function OpenCloudErrorAlert() {
  const { project } = useProject();

  if (project?.openCloudError) {
    return (
      <div className="-mx-2 mb-4 rounded-lg border border-amber-400 bg-amber-400/10 p-3">
        <div className="flex items-center justify-start gap-x-1">
          <ExclamationTriangleIcon className="h-4 w-4 font-medium text-amber-800 dark:text-amber-500" />
          <span className="text-sm font-medium text-amber-800 dark:text-amber-500">
            Alert
          </span>
        </div>
        <p className="mt-1 text-[13px] text-amber-800 dark:text-amber-500">
          Metrik had an authentication error with the Roblox Open Cloud API.
          Please reauthenticate your Metrik Project with your Roblox experience.
        </p>
        <Link
          href={`/api/projects/reauth?projectId=${project.id}`}
          className="mt-2 flex items-center justify-start gap-x-1 text-sm font-medium text-amber-800"
        >
          <span>Reauthenticate</span> <LinkIcon className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  return null;
}

function SidebarTab({
  name,
  icon,
  href,
  rawIcon,
  active,
  target,
}: {
  name: string;
  icon?: LucideIcon;
  rawIcon?: ReactNode;
  target?: HTMLAttributeAnchorTarget;
  href: string;
  active: boolean;
}) {
  const Icon = icon;

  return (
    <li>
      <Link
        href={href}
        target={target ?? undefined}
        className={cn(
          active && "bg-neutral-100 dark:bg-neutral-800",
          "group flex items-center gap-x-2 truncate rounded-lg px-2 py-1.5 text-sm font-semibold leading-6 transition-colors duration-100 hover:bg-neutral-100 dark:hover:bg-neutral-800",
        )}
      >
        <span
          className={cn(
            // active && "ring-2 ring-blue-500",

            "flex h-6 w-6 shrink-0 items-center justify-center overflow-clip rounded-lg border border-border bg-white text-[0.625rem] font-medium dark:bg-neutral-800",
            active && "dark:bg-dark-tremor-background",
          )}
        >
          {Icon && !rawIcon ? (
            <Icon
              className={cn(
                "h-4 w-4 shrink-0 text-neutral-400 dark:text-neutral-400",
                active && "text-blue-500 dark:text-blue-500",
              )}
            />
          ) : !Icon && !rawIcon ? (
            <span className="text-[0.75rem] text-neutral-400 dark:text-neutral-400">
              {name[0]}
            </span>
          ) : (
            <span>{rawIcon}</span>
          )}
        </span>
        <span
          className={cn(
            "truncate text-neutral-700 dark:text-neutral-200",
            active && "text-neutral-700  dark:text-neutral-200",
          )}
        >
          {name}
        </span>
      </Link>
    </li>
  );
}

function SidebarMain({
  children,
  project,
  projectId,
  tab,
  subContent,
  subTab,
}: {
  children: ReactNode;
  project: boolean;
  projectId?: string;
  tab: string;
  subContent: ReactNode;
  subTab?: {
    name: string;
    href: string;
  };
}) {
  const { project: currentProject } = useProject();
  const Icon = (project ? projectTabs : studioTabs).find(
    ({ name }) => name === tab,
  )?.icon;
  const { currentStudio } = useStudio();
  const router = useRouter();

  const { mutate, isPending } = api.billing.createCheckoutSession.useMutation({
    onSuccess: async (opts) => {
      const stripe = await getStripe();

      await stripe?.redirectToCheckout({ sessionId: opts.sessionId });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const allowedPrefixes = ["/new", "/settings"];

  return (
    <div className="mt-[1vh] h-[98vh] scroll-py-4 overflow-y-scroll bg-neutral-50 dark:bg-dark-tremor-background-muted md:ml-64 md:w-full md:rounded-l-2xl md:border">
      <div className=" z-20 hidden w-full items-center justify-between bg-neutral-50 px-4 pb-6 pt-4 dark:bg-dark-tremor-background-muted md:flex md:px-6">
        <div className="flex items-center justify-start gap-x-2">
          <nav className="flex" aria-label="Breadcrumb">
            <ol role="list" className="flex items-center space-x-3">
              <li>
                <div>
                  <Link
                    href="/"
                    className="text-neutral-400 hover:text-neutral-500 dark:text-zinc-200 dark:hover:text-neutral-300"
                  >
                    <HomeIcon
                      className="h-5 w-5 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <span className="sr-only">Home</span>
                  </Link>
                </div>
              </li>
              {project && (
                <li>
                  <div className="flex items-center">
                    <ChevronRightIcon
                      className="h-5 w-5 flex-shrink-0 text-gray-400"
                      aria-hidden="true"
                    />
                    <Link
                      href={`/projects/${projectId}/analytics`}
                      className="ml-3 flex items-center justify-center space-x-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-700 dark:text-neutral-100 dark:hover:text-neutral-200"
                    >
                      {currentProject && (
                        <Image
                          height="18"
                          width="18"
                          src={`https://thumbs.metrik.app/game/${currentProject.universeId}`}
                          alt={`${currentProject.name}'s Roblox icon`}
                          className="inline-flex rounded-md border"
                        />
                      )}
                      <span>{currentProject?.name ?? "..."}</span>
                    </Link>
                  </div>
                </li>
              )}
              <li>
                <div className="flex items-center">
                  <ChevronRightIcon
                    className="h-5 w-5 flex-shrink-0 text-gray-400"
                    aria-hidden="true"
                  />
                  <Link
                    href={
                      project
                        ? `/projects/${projectId}/${
                            projectTabs.find(({ name }) => name === tab)?.slug
                          }`
                        : `/${
                            studioTabs.find(({ name }) => name === tab)?.href
                          }`
                    }
                    className="ml-3 text-sm font-medium  text-neutral-500 hover:text-neutral-700 dark:text-neutral-100 dark:hover:text-neutral-200"
                  >
                    {tab}
                  </Link>
                </div>
              </li>
              {subTab && (
                <li>
                  <div className="flex items-center">
                    <ChevronRightIcon
                      className="h-5 w-5 flex-shrink-0 text-gray-400"
                      aria-hidden="true"
                    />
                    <Link
                      href={
                        project
                          ? `/projects/${projectId}/${
                              projectTabs.find(({ name }) => name === tab)?.slug
                            }/${subTab.href}`
                          : `/${
                              studioTabs.find(({ name }) => name === tab)?.href
                            }/${subTab.href}`
                      }
                      className="ml-3 text-sm font-medium  text-neutral-500 hover:text-neutral-700 dark:text-neutral-100 dark:hover:text-neutral-200"
                    >
                      {subTab.name}
                    </Link>
                  </div>
                </li>
              )}
            </ol>
          </nav>
        </div>

        <div className="flex items-center justify-end space-x-4">
          {currentStudio?.trialEnds &&
            currentStudio?.trialEnds > new Date() &&
            currentStudio.plan === "TRIAL" &&
            !currentStudio?.stripeSubscriptionId && (
              <Badge>
                {Math.round(
                  (currentStudio.trialEnds.getTime() - new Date().getTime()) /
                    (1000 * 3600 * 24),
                )}{" "}
                day
                {Math.round(
                  (currentStudio.trialEnds.getTime() - new Date().getTime()) /
                    (1000 * 3600 * 24),
                ) > 1
                  ? "s"
                  : ""}{" "}
                remaining in trial
              </Badge>
            )}
          <DarkModeSwitcher />

          <Dropdown />
        </div>
      </div>

      <div className="h-[90%] px-4 pb-4 md:px-6">
        {currentStudio?.trialEnds &&
        currentStudio.trialEnds < new Date() &&
        currentStudio.plan === Plan.TRIAL &&
        !router.pathname.startsWith("/settings") &&
        !router.pathname.startsWith("/new/studio") ? (
          <div className="h-full">
            <div className="flex h-[95%] flex-col items-center justify-center gap-y-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mb-4 size-[70px]"
                viewBox="0 0 123 123"
                fill="none"
              >
                <rect
                  width="119"
                  height="119"
                  x="1.74"
                  y="1.74"
                  stroke="#3B82F6"
                  strokeOpacity=".24"
                  strokeWidth="3"
                  rx="32.5"
                />
                <rect
                  width="104"
                  height="104"
                  x="9.24"
                  y="9.24"
                  fill="#3B82F6"
                  rx="25"
                />
                <path
                  fill="url(#a)"
                  fillOpacity=".8"
                  fillRule="evenodd"
                  d="M29.24 61.259c0-6.675 2.027-12.85 5.504-17.975l8.405 8.4a20.69 20.69 0 0 0-.35 18.5l-8.43 8.45c-3.253-5-5.129-11-5.129-17.4v.025Zm23.015-18.525-8.406-8.375a32.034 32.034 0 0 1 45.025 10.75 31.984 31.984 0 0 1-.338 32.828 32.012 32.012 0 0 1-12.438 11.639A32.036 32.036 0 0 1 43.3 87.759l8.255-8.25a20.799 20.799 0 0 0 27.94-7.653 20.764 20.764 0 0 0-6.847-28.133 20.798 20.798 0 0 0-20.418-.964l.026-.025Zm2.351 11.575a9.95 9.95 0 0 0 0 14.075 9.962 9.962 0 0 0 17-7.038 9.947 9.947 0 0 0-6.147-9.195 9.963 9.963 0 0 0-10.853 2.158Z"
                  clipRule="evenodd"
                />
                <defs>
                  <linearGradient
                    id="a"
                    x1="61.24"
                    x2="61.24"
                    y1="29.24"
                    y2="93.24"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#fff" />
                    <stop offset="1" stopColor="#fff" stopOpacity=".5" />
                  </linearGradient>
                </defs>
              </svg>
              <h1 className="block font-display text-2xl font-medium">
                Your free trial of Metrik has ended
              </h1>
              <p className="text-center text-sm text-neutral-500">
                Please subscribe to the Pro plan to restore your access to this
                Metrik Studio.
              </p>
              <div className="mt-4 flex items-center justify-center space-x-4">
                <MerlinButton
                  onClick={() => {
                    mutate({
                      studioId: currentStudio.id,
                    });
                  }}
                  loading={isPending}
                >
                  Subscribe to Metrik
                </MerlinButton>
                <MerlinButton variant="outline" asChild>
                  <Link href="https://metrik.app/pricing">Go to pricing →</Link>
                </MerlinButton>
              </div>
            </div>
          </div>
        ) : currentStudio &&
          currentStudio.plan === Plan.NONE &&
          !router.pathname.startsWith("/settings") &&
          !router.pathname.startsWith("/new/studio") ? (
          <div className="h-full">
            <div className="flex h-[95%] flex-col items-center justify-center gap-y-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mb-4 size-[70px]"
                viewBox="0 0 123 123"
                fill="none"
              >
                <rect
                  width="119"
                  height="119"
                  x="1.74"
                  y="1.74"
                  stroke="#3B82F6"
                  strokeOpacity=".24"
                  strokeWidth="3"
                  rx="32.5"
                />
                <rect
                  width="104"
                  height="104"
                  x="9.24"
                  y="9.24"
                  fill="#3B82F6"
                  rx="25"
                />
                <path
                  fill="url(#a)"
                  fillOpacity=".8"
                  fillRule="evenodd"
                  d="M29.24 61.259c0-6.675 2.027-12.85 5.504-17.975l8.405 8.4a20.69 20.69 0 0 0-.35 18.5l-8.43 8.45c-3.253-5-5.129-11-5.129-17.4v.025Zm23.015-18.525-8.406-8.375a32.034 32.034 0 0 1 45.025 10.75 31.984 31.984 0 0 1-.338 32.828 32.012 32.012 0 0 1-12.438 11.639A32.036 32.036 0 0 1 43.3 87.759l8.255-8.25a20.799 20.799 0 0 0 27.94-7.653 20.764 20.764 0 0 0-6.847-28.133 20.798 20.798 0 0 0-20.418-.964l.026-.025Zm2.351 11.575a9.95 9.95 0 0 0 0 14.075 9.962 9.962 0 0 0 17-7.038 9.947 9.947 0 0 0-6.147-9.195 9.963 9.963 0 0 0-10.853 2.158Z"
                  clipRule="evenodd"
                />
                <defs>
                  <linearGradient
                    id="a"
                    x1="61.24"
                    x2="61.24"
                    y1="29.24"
                    y2="93.24"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#fff" />
                    <stop offset="1" stopColor="#fff" stopOpacity=".5" />
                  </linearGradient>
                </defs>
              </svg>
              <h1 className="block font-display text-2xl font-medium">
                Sorry to see you go!
              </h1>
              <p className="text-center text-sm text-neutral-500">
                Your Metrik subscription has been canceled.
                <span className="block">
                  Please resubscribe to restore access to your Metrik Studio.
                </span>
              </p>
              <div className="mt-4 flex items-center justify-center space-x-4">
                <MerlinButton
                  onClick={() => {
                    mutate({
                      studioId: currentStudio.id,
                    });
                  }}
                  loading={isPending}
                >
                  Resubscribe to Metrik
                </MerlinButton>
                <MerlinButton variant="outline" asChild>
                  <Link href="https://metrik.app/pricing">Go to pricing →</Link>
                </MerlinButton>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full pb-6">
            {subContent && (
              <div className="z-20 mx-auto w-full pb-4">{subContent}</div>
            )}
            {children}
          </div>
        )}
      </div>
      {/* <Pages>
        <CommandMenu />
      </Pages> */}
    </div>
  );
}

// function Tabs({
//   project,
//   tab,
//   projectId,
//   atTop,
// }: {
//   project: boolean;
//   projectId?: string;
//   tab: string;
//   atTop: boolean;
// }) {
//   const router = useRouter();

//   const id = projectId;
//   const { isAdmin } = useMembership();

//   const tabIndex = (project ? projectTabs : studioTabs).findIndex(
//     (item) => item.slug === tab,
//   );

//   return (
//     <>
//       <div className="mx-auto flex w-full flex-row items-center bg-white px-4 dark:bg-dark-tremor-background sm:px-6">
//         <motion.div
//           initial={false}
//           variants={{
//             initial: {
//               opacity: 0,
//             },
//             animate: {
//               opacity: 1,
//             },
//           }}
//           animate={atTop ? "animate" : "initial"}
//           transition={{
//             type: "tween",
//             duration: 0.1,
//             delay: 0.05,
//           }}
//         >
//           <Link href="/">
//             <Logo className="h-5 w-5" />
//           </Link>
//         </motion.div>

//         <motion.div
//           initial={false}
//           animate={
//             atTop
//               ? {
//                   translateX: "16px",
//                 }
//               : {
//                   translateX: "-20px",
//                 }
//           }
//           transition={{
//             type: "tween",
//             duration: 0.2,
//             delay: 0.05,
//           }}
//           className="bg-white dark:bg-dark-tremor-background"
//         >
//           {project ? (
//             <TabGroup
//               className="bg-white dark:bg-dark-tremor-background"
//               defaultIndex={0}
//               index={tabIndex}
//               onIndexChange={(index: number) => {
//                 void router.replace(
//                   `/projects/${id as string}/${
//                     projectTabs[index]?.slug as string
//                   }`,
//                 );
//               }}
//             >
//               <TabList className="space-x-3 !border-none font-medium">
//                 <Tab icon={BarChartIcon}>Overview</Tab>
//                 <Tab icon={AtomIcon}>Actions</Tab>
//                 <Tab icon={ScrollIcon}>Issues</Tab>

//                 <Tab icon={ShieldIcon}>Moderation</Tab>
//                 <Tab icon={MegaphoneIcon}>Broadcasts</Tab>
//                 <Tab icon={CogIcon}>Settings</Tab>
//               </TabList>
//             </TabGroup>
//           ) : (
//             <TabGroup
//               defaultIndex={0}
//               index={tabIndex}
//               onIndexChange={(index: number) => {
//                 studioTabs[index]?.slug === "projects"
//                   ? void router.replace("/")
//                   : void router.replace(
//                       `/${studioTabs[index]?.slug as string}`,
//                     );
//               }}
//               className="bg-white dark:bg-dark-tremor-background"
//             >
//               <TabList className="!border-none font-medium">
//                 <Tab icon={LayoutGridIcon}>Projects</Tab>
//                 <Tab icon={CogIcon}>Settings</Tab>
//               </TabList>
//             </TabGroup>
//           )}
//         </motion.div>
//       </div>
//     </>
//   );
// }

function BaseMobileTab({
  name,
  icon,
  href,
  active,
}: {
  name: string;
  icon: LucideIcon;
  href: string;
  active: boolean;
}) {
  const Icon = icon;
  return (
    <Link
      href={href}
      className={clsx(
        "flex items-center space-x-2 rounded-r-md border-l-4 px-2 py-1",
        active
          ? "border-l-blue-500 bg-blue-50 font-medium dark:bg-blue-500/10"
          : "ro  border-l-transparent hover:border-l-neutral-300 dark:hover:border-l-neutral-800",
      )}
    >
      <Icon
        className={clsx(
          "h-5 w-5",
          active
            ? "text-black dark:text-white"
            : "text-neutral-500 dark:text-neutral-400",
        )}
      />
      <span>{name}</span>
    </Link>
  );
}

function MobileNavbar({
  project,
  tab,
  id,
}: {
  project: boolean;
  tab: string;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { project: currentProject, isLoading } = useProject();
  const { data: session } = useSession();

  const { isAdmin } = useMembership();

  const tabIndex = (project ? projectTabs : studioTabs).findIndex(
    (item) => item.slug === tab,
  );

  const isSm = useMedia("(min-width: 640px)", false);

  useEffect(() => {
    if (isSm === true) {
      setOpen(false);
    }
  }, [isSm]);

  return (
    <div className="flex items-center justify-between py-4">
      <Link href="/">
        <Logo />
      </Link>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger>
          <MenuIcon className="h-6 w-6 text-neutral-700 dark:text-neutral-600" />
        </Dialog.Trigger>
        <Dialog.Portal>
          <div className="fixed inset-0 z-50 flex items-start justify-center">
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm transition-opacity animate-in fade-in" />
            <Dialog.Content className="fixed z-50 grid w-full gap-4 rounded-b-lg bg-white p-6 animate-in data-[state=open]:fade-in-90 data-[state=open]:slide-in-from-top-10 dark:bg-dark-tremor-background sm:max-w-lg sm:rounded-lg sm:zoom-in-90 data-[state=open]:sm:slide-in-from-top-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <StudioSwitcher />

                  {project && currentProject && !isLoading && id ? (
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
                      <span className="cursor-pointer truncate text-sm font-medium leading-5 max-[400px]:max-w-[18vw] min-[400px]:max-w-[25vw] min-[450px]:max-w-[30vw]">
                        {currentProject.name}
                      </span>
                    </>
                  ) : project && currentProject && isLoading && id ? (
                    <>
                      <span>
                        <svg
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          className=" h-8 w-8 text-neutral-200 dark:text-neutral-700"
                        >
                          <path d="M16.88 3.549L7.12 20.451" />
                        </svg>
                      </span>
                      <span className="animate-pulse">
                        <div className="h-3.5 w-40 rounded-md bg-neutral-200 dark:text-neutral-700"></div>
                      </span>
                    </>
                  ) : (
                    <></>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <DarkModeSwitcher />
                  <Dialog.Close asChild>
                    <Button
                      variant="light"
                      color="gray"
                      className="aspect-square p-2"
                    >
                      <X className="h-5 w-5" strokeWidth={2.5} />
                    </Button>
                  </Dialog.Close>
                </div>
              </div>
              <div className="flex flex-col space-y-0.5">
                {project
                  ? projectTabs.map((projectTab) => (
                      <BaseMobileTab
                        key={projectTab.name}
                        name={projectTab.name}
                        icon={projectTab.icon}
                        href={`/projects/${id}/${projectTab.slug}`}
                        active={tab === projectTab.slug}
                      />
                    ))
                  : studioTabs.map((studioTab) => (
                      <BaseMobileTab
                        key={studioTab.name}
                        name={studioTab.name}
                        icon={studioTab.icon}
                        href={studioTab.slug === "projects" ? "/" : "/settings"}
                        active={tab === studioTab.slug}
                      />
                    ))}
              </div>
              <div className="border-b" />
              {session && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 overflow-clip rounded-full bg-neutral-300 dark:bg-neutral-600">
                      <Image
                        height="40"
                        width="40"
                        className="h-full w-full rounded-full"
                        src={`https://thumbs.metrik.app/headshot/${
                          session.user.robloxId || 1
                        }/60`}
                        alt={session.user.name as string}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{session.user.name}</p>
                      <p className="font-mono text-xs text-neutral-600 dark:text-neutral-400">
                        {session.user.robloxId}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link
                      href="/user/settings"
                      className="px-2 py-1 text-sm font-medium text-neutral-800 dark:text-neutral-100"
                    >
                      Account Settings
                    </Link>
                    <Button
                      size="xs"
                      variant="secondary"
                      className="border-neutral-300 text-neutral-800 hover:bg-neutral-100 hover:text-black dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800 dark:hover:text-white"
                    >
                      Sign out
                    </Button>
                  </div>
                </div>
              )}
            </Dialog.Content>
          </div>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

export function AppLayout({
  children,
  project,
  tab,
  title,
  whiteBg,
  subContent,
  subTab,
}: AppLayoutProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const ref = useRef<HTMLDivElement>(null);
  const [tabsAtTop, setTabsAtTop] = useState(false);

  const id = router.query.id;

  // function baseTabEvent() {
  //   if (ref.current) {
  //     if (ref.current.offsetTop - window.scrollY <= 0.5) {
  //       if (!tabsAtTop) {
  //         setTabsAtTop(true);
  //       }
  //     } else {
  //       if (tabsAtTop) {
  //         setTabsAtTop(false);
  //       }
  //     }
  //   }
  // }

  // useEventListener("scroll", baseTabEvent);
  // useEventListener("resize", baseTabEvent);

  function capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  const tabName = (project ? projectTabs : studioTabs).find(
    (v) => v.slug === tab,
  )?.name;

  return (
    <Layout title={title ?? tabName}>
      <StudioProvider>
        <MembershipProvider>
          <ProjectProvider id={id as string | undefined}>
            <div
              className={clsx(
                "relative flex min-h-full flex-col overscroll-contain md:flex-row",
                whiteBg
                  ? "bg-white dark:bg-dark-tremor-background"
                  : "bg-white dark:bg-dark-tremor-background",
              )}
            >
              <Sidebar project={!!project} tab={tab} projectId={id as string} />
              <div className="mx-auto w-full border-b bg-white px-4 dark:border-b-neutral-700 dark:bg-dark-tremor-background sm:px-6 md:hidden">
                <MobileNavbar tab={tab} project={!!project} id={id as string} />
              </div>
              <SidebarMain
                project={!!project}
                projectId={project ? (id as string) : undefined}
                subContent={subContent}
                tab={
                  project
                    ? projectTabs.find((v) => v.slug === tab)?.name ?? ""
                    : studioTabs.find((v) => v.slug === tab)?.name ?? ""
                }
                subTab={subTab}
              >
                {children}
                {/* <div className="dark:bg-dark-tremor-background mt-8 border-t bg-white">
                  <div className="mx-auto w-full px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex">
                          
                          <span className="ml-2 text-sm text-neutral-600 dark:text-neutral-500">
                            &copy; {new Date().getFullYear()} Metrik
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Status />
                      </div>
                    </div>
                  </div>
                </div> */}
              </SidebarMain>
              {/* <div className="dark:bg-dark-tremor-background hidden bg-white sm:block">
                <div className="mx-auto w-full px-4 pb-3 sm:px-6 ">
                  <AppNavbar
                    session={session}
                    studio={true}
                    projectId={id as string | null}
                  />
                </div>
              </div>
              <div ref={ref} className="sticky top-0 z-20 hidden sm:block">
                <div className="dark:border-b-border z-20 border-b-[1.3px] bg-white">
                  <Tabs
                    project={!!project}
                    tab={tab}
                    atTop={tabsAtTop}
                    projectId={id as string | undefined}
                  />
                </div>
              </div> */}

              {/* <Main>{children}</Main> */}
            </div>
          </ProjectProvider>
        </MembershipProvider>
      </StudioProvider>
    </Layout>
  );
}
