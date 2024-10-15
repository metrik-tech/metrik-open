import type { ReactNode } from "react";
import { useEffect, useState, type ChangeEvent } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import {
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/16/solid";
import { CodeBracketSquareIcon } from "@heroicons/react/20/solid";
import { Badge, Card, Tab, TabGroup, TabList, TextInput } from "@tremor/react";
import { formatDistance, subDays } from "date-fns";

import { type Action, type ActionArguments } from "@metrik/db/client";

import { ActionItem } from "@/components/actions/action-item";
import { ActionTabs } from "@/components/actions/tabs";
import { AppLayout } from "@/components/app-layout";
import { Layout } from "@/components/base-layout";
import Code from "@/components/code";
import { Button } from "@/components/merlin/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/merlin/select";
import { PageWrapper } from "@/components/page-wrapper";
import { Footer } from "@/components/ui/footer";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useProject } from "@/hooks/project";
import { api } from "@/utils/api";
import { cn } from "@/utils/cn";

// const Code = dynamic(() => import("@/components/Code"), {
//   ssr: false,
// });

const snippet = `local metrik = require(game.ReplicatedStorage.Metrik)

local test = {
  name = "Test Action",
  key = "testAction",
  boolean = true,
  number = 1,
  comments = "This is a test action", -- this is a comment
  arguments = {
    {
      name = "test",
      required = true,
      type = "string",
      description = "The test argument",
    },
  },
}
`;

export type ExtendedAction = Omit<Action, "placeId"> & {
  place: { name: string; id: string };
};

const actions2 = [
  {
    id: "clrmhd10g000008jx8l1gcank",
    activated: subDays(new Date(), 17),
    name: "Give Money",
    key: "give-money",
    description: "Give money to a user",
    place: {
      name: "Steve's Place",
      id: "123456",
    },
    placeVersion: 256,
    projectId: "1",
    serverIds: new Array(44).fill("") as string[],
  },
  {
    id: "a",
    activated: subDays(new Date(), 17),
    name: "Give Money",
    key: "give-money",
    description: "Give money to a user",
    place: {
      name: "Steve's Place",
      id: "123457",
    },
    placeVersion: 257,
    projectId: "1",
    serverIds: new Array(44).fill("") as string[],
  },
] satisfies ExtendedAction[];

function filter(actions: ExtendedAction[]) {
  return Object.values(
    actions.reduce(
      (acc, obj) => {
        const key = `${obj.place.id}-${obj.key}`; // Combine placeId and key for grouping
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(obj);
        return acc;
      },
      {} as Record<string, ExtendedAction[]>,
    ),
  ).map((group) => {
    return group.reduce((latestObj, currentObj) => {
      return currentObj.placeVersion > latestObj.placeVersion
        ? currentObj
        : latestObj;
    });
  });
}

export default function ActionsTab() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [results, setResults] = useState<ExtendedAction[]>([]);
  const [parent] = useAutoAnimate();
  const { project } = useProject();
  const [places, setPlaces] = useState<
    {
      name: string;
      id: string;
    }[]
  >([]);

  const { data: actions, isLoading } = api.actions.getAll.useQuery(
    {
      projectId: project?.id as string,
    },
    {
      enabled: !!project?.id,
    },
  );

  useEffect(() => {
    if (actions) {
      const localPlaces = actions
        .map((action) => action.place)
        .reduce(
          (acc, cur) => {
            if (!acc.find((p) => p.id === cur.id)) {
              acc.push(cur);
            }
            return acc;
          },
          [] as {
            name: string;
            id: string;
          }[],
        );

      setPlaces(localPlaces);

      setSelectedPlaceId(
        actions.find((action) => action.place.id === project?.placeId)?.place
          .id ?? places[0]!.id,
      );
    }
  }, [actions]);

  const [selectedPlaceId, setSelectedPlaceId] = useState<string | undefined>(
    places[0]?.id,
  );

  console.log(selectedPlaceId);

  // Step 2: Filter out duplicates, keeping only the latest placeVersion

  useEffect(() => {
    if (actions) {
      setResults(
        filter(actions).filter((action) => action.place.id === selectedPlaceId),
      );
    }
  }, [selectedPlaceId, actions]);

  async function search(term: string) {
    if (!actions) return;
    if (!term || term.length < 3) return setResults(actions);

    const Fuse = (await import("fuse.js")).default;
    const fuse = new Fuse(actions, {
      keys: ["name", "key", "place.id"],
    });

    const results = fuse
      .search(term)
      .map((result) => result.item)
      .filter((result) => result.place.id === selectedPlaceId);

    setResults(filter(results));
  }

  return (
    <Layout title="Actions">
      <ActionTabs currentTab="run" />
      <div>
        {!isLoading && actions?.length === 0 && (
          <div className="mt-6">
            <p className="text-gray-500">
              There are no actions for this project.
            </p>
          </div>
        )}

        <div className="mb-4 flex flex-col items-center justify-start gap-x-2 gap-y-2 lg:flex-row">
          <TextInput
            icon={MagnifyingGlassIcon}
            className="w-full"
            placeholder="Search actions"
            onValueChange={search}
          />
          <Select
            onValueChange={(value) => {
              selectedPlaceId === value
                ? setSelectedPlaceId(undefined)
                : setSelectedPlaceId(value);
            }}
            value={
              selectedPlaceId ??
              (places.length > 0
                ? places.find((place) => place.id === project?.placeId)?.id ??
                  places[0]!.id
                : undefined)
            }
            required={false}
          >
            <SelectTrigger className="lg:max-w-64">
              <SelectValue placeholder="Select a place" />
            </SelectTrigger>
            <SelectContent>
              {places.map((place) => (
                <SelectItem
                  key={place.id}
                  value={place.id}
                  className="flex items-center justify-start"
                >
                  <div
                    className="flex h-full items-center justify-between gap-x-1.5"
                    onClick={() => {
                      console.log("clicked");
                      if (selectedPlaceId === place.id) {
                        setSelectedPlaceId(undefined);
                      }
                    }}
                  >
                    <div className="flex items-center justify-start gap-x-1.5">
                      <img
                        src={`https://thumbs.metrik.app/place/${place.id}`}
                        className="size-5 rounded-md border"
                      />
                      <span>{place.name}</span>
                    </div>
                    {project?.placeId === place.id && (
                      <Badge
                        color="gray"
                        size="xs"
                        className="block cursor-pointer font-normal"
                      >
                        Root
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            prefix={QuestionMarkCircleIcon}
            className="w-full lg:w-fit"
            asChild
          >
            <Link href="https://docs.metrik.app/sdk/actions" target="_blank">
              Documentation
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-2" ref={parent}>
          {actions?.length &&
            results.map((action) => (
              <ActionItem action={action} actions={actions} key={action.id} />
            ))}
        </div>
      </div>
    </Layout>
  );
}

ActionsTab.PageWrapper = PageWrapper;
ActionsTab.getLayout = function getLayout(page: ReactNode) {
  return (
    <AppLayout tab="actions" project>
      {page}
    </AppLayout>
  );
};

function DynamicActionIcon() {
  return (
    <div className="relative h-10 w-10">
      <svg
        className="absolute left-0 top-0 h-10 w-10 text-blue-400"
        fill="none"
        id="status-icon"
        viewBox="0 0 32 32"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clipPath="url(#a)">
          <rect fill="#000" height="32" rx="8" width="32"></rect>
          <rect
            fill="url(#b)"
            fillOpacity="0.3"
            height="32"
            rx="8"
            width="32"
          ></rect>
          <rect
            fill="currentColor"
            fillOpacity="0.05"
            height="32"
            rx="8"
            width="32"
          ></rect>
          <rect
            height="29"
            rx="6.5"
            stroke="#000"
            strokeWidth="3"
            width="29"
            x="1.5"
            y="1.5"
          ></rect>
          <rect
            height="31"
            rx="7.5"
            stroke="url(#c)"
            width="31"
            x="0.5"
            y="0.5"
          ></rect>
          <g filter="url(#d)">
            <circle
              cx="16"
              cy="16"
              r="4.5"
              stroke="currentColor"
              strokeOpacity="1"
              strokeWidth="5"
            ></circle>
          </g>
          <g filter="url(#e)">
            <circle
              cx="16"
              cy="16"
              r="3.5"
              stroke="currentColor"
              strokeOpacity="1"
              strokeWidth="5"
            ></circle>
          </g>
          <mask
            height="30"
            id="g"
            maskUnits="userSpaceOnUse"
            width="30"
            x="1"
            y="1"
            style={{ maskType: "alpha" }}
          >
            <path d="M1.637 1.636h29.091v29.091H1.637z" fill="url(#f)"></path>
          </mask>
          <g mask="url(#g)">
            <path
              d="M.5.5h5v5h-5zM5.5.5h5v5h-5z"
              stroke="#fff"
              strokeOpacity="0.07"
            ></path>
            <path d="M11 1h4v4h-4z" fill="#fff" fillOpacity="0.1"></path>
            <path
              d="M10.5.5h5v5h-5zM15.5.5h5v5h-5zM20.5.5h5v5h-5z"
              stroke="#fff"
              strokeOpacity="0.07"
            ></path>
            <path d="M26 1h4v4h-4z" fill="#fff" fillOpacity="0.1"></path>
            <path d="M25.5.5h5v5h-5z" stroke="#fff" strokeOpacity="0.07"></path>
            <path
              d="M.5 5.5h5v5h-5z"
              opacity="0.4"
              stroke="#fff"
              strokeOpacity="0.07"
            ></path>
            <g opacity="0.4">
              <path d="M6 6h4v4H6z" fill="#fff" fillOpacity="0.06"></path>
              <path
                d="M5.5 5.5h5v5h-5z"
                stroke="#fff"
                strokeOpacity="0.07"
              ></path>
            </g>
            <path
              d="M10.5 5.5h5v5h-5z"
              opacity="0.4"
              stroke="#fff"
              strokeOpacity="0.07"
            ></path>
            <g opacity="0.4">
              <path d="M16 6h4v4h-4z" fill="#fff" fillOpacity="0.06"></path>
              <path
                d="M15.5 5.5h5v5h-5z"
                stroke="#fff"
                strokeOpacity="0.07"
              ></path>
            </g>
            <path
              d="M20.5 5.5h5v5h-5zM25.5 5.5h5v5h-5z"
              opacity="0.4"
              stroke="#fff"
              strokeOpacity="0.07"
            ></path>
            <path d="M1 11h4v4H1z" fill="#fff" fillOpacity="0.1"></path>
            <path
              d="M.5 10.5h5v5h-5zM5.5 10.5h5v5h-5zM10.5 10.5h5v5h-5zM15.5 10.5h5v5h-5z"
              stroke="#fff"
              strokeOpacity="0.07"
            ></path>
            <path d="M21 11h4v4h-4z" fill="#fff" fillOpacity="0.06"></path>
            <path
              d="M20.5 10.5h5v5h-5zM25.5 10.5h5v5h-5zM.5 15.5h5v5h-5zM5.5 15.5h5v5h-5zM10.5 15.5h5v5h-5zM15.5 15.5h5v5h-5zM20.5 15.5h5v5h-5z"
              stroke="#fff"
              strokeOpacity="0.07"
            ></path>
            <path d="M26 16h4v4h-4z" fill="#fff" fillOpacity="0.1"></path>
            <path
              d="M25.5 15.5h5v5h-5zM.5 20.5h5v5h-5z"
              stroke="#fff"
              strokeOpacity="0.07"
            ></path>
            <path d="M6 21h4v4H6z" fill="#fff" fillOpacity="0.06"></path>
            <path
              d="M5.5 20.5h5v5h-5zM10.5 20.5h5v5h-5zM15.5 20.5h5v5h-5z"
              stroke="#fff"
              strokeOpacity="0.07"
            ></path>
            <path d="M21 21h4v4h-4z" fill="#fff" fillOpacity="0.06"></path>
            <path
              d="M20.5 20.5h5v5h-5zM25.5 20.5h5v5h-5zM.5 25.5h5v5h-5zM5.5 25.5h5v5h-5z"
              stroke="#fff"
              strokeOpacity="0.07"
            ></path>
            <path d="M11 26h4v4h-4z" fill="#fff" fillOpacity="0.1"></path>
            <path
              d="M10.5 25.5h5v5h-5zM15.5 25.5h5v5h-5zM20.5 25.5h5v5h-5zM25.5 25.5h5v5h-5z"
              stroke="#fff"
              strokeOpacity="0.07"
            ></path>
          </g>
        </g>
        <rect
          height="31"
          rx="7.5"
          stroke="url(#h)"
          width="31"
          x="0.5"
          y="0.5"
        ></rect>
        <defs>
          <linearGradient
            gradientUnits="userSpaceOnUse"
            id="b"
            x1="16"
            x2="16"
            y1="0"
            y2="32"
          >
            <stop stopColor="#fff"></stop>
            <stop offset="1" stopColor="#fff" stopOpacity="0"></stop>
          </linearGradient>
          <linearGradient
            gradientUnits="userSpaceOnUse"
            id="c"
            x1="16"
            x2="16"
            y1="0"
            y2="32"
          >
            <stop stopColor="#fff" stopOpacity="0.6"></stop>
            <stop offset="1" stopColor="#fff" stopOpacity="0.3"></stop>
          </linearGradient>
          <linearGradient
            gradientUnits="userSpaceOnUse"
            id="h"
            x1="16"
            x2="16"
            y1="0"
            y2="32"
          >
            <stop stopColor="#fff" stopOpacity="0.6"></stop>
            <stop offset="1" stopColor="#fff" stopOpacity="0.3"></stop>
          </linearGradient>
          <filter
            colorInterpolationFilters="sRGB"
            filterUnits="userSpaceOnUse"
            height="54"
            id="d"
            width="54"
            x="-11"
            y="-11"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              result="effect1_foregroundBlur_793_205"
              stdDeviation="10"
            ></feGaussianBlur>
          </filter>
          <filter
            colorInterpolationFilters="sRGB"
            filterUnits="userSpaceOnUse"
            height="32"
            id="e"
            width="32"
            x="0"
            y="0"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feBlend
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            ></feBlend>
            <feGaussianBlur
              result="effect1_foregroundBlur_793_205"
              stdDeviation="5"
            ></feGaussianBlur>
          </filter>
          <radialGradient
            cx="0"
            cy="0"
            gradientTransform="rotate(90 0 16.182) scale(12.3182)"
            gradientUnits="userSpaceOnUse"
            id="f"
            r="1"
          >
            <stop stopColor="#fff"></stop>
            <stop offset="1" stopColor="#fff" stopOpacity="0"></stop>
          </radialGradient>
          <clipPath id="a">
            <rect fill="#fff" height="32" rx="8" width="32"></rect>
          </clipPath>
        </defs>
      </svg>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.9"
        stroke="url(#status-icon-fill)"
        className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2"
        fillOpacity="0.9"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.25 9.75 16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z"
        />
        <defs>
          <linearGradient
            gradientUnits="userSpaceOnUse"
            id="status-icon-fill"
            x1="0"
            x2="10"
            y1="0"
            y2="45"
          >
            <stop stopColor="white"></stop>
            <stop offset="0.2" stopColor="white"></stop>
            <stop offset="1" stopColor="white" stopOpacity="0"></stop>
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
