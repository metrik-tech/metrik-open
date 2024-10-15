import { Fragment, useState, type Dispatch, type SetStateAction } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  ArrowTopRightOnSquareIcon,
  CheckIcon,
} from "@heroicons/react/16/solid";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { Badge, NumberInput, TextInput } from "@tremor/react";
import { LoaderIcon } from "lucide-react";

import {
  ActionRunStatus,
  type ActionArgumentType,
  type ActionRun,
} from "@metrik/db/client";
import { nid } from "@metrik/id";

import { useProject } from "@/hooks/project";
import { api } from "@/utils/api";
import Code from "../code";
import { LoadingSpinner } from "../loading-spinner";
import { Button } from "../merlin/button";
import { Sheet, SheetClose, SheetContent } from "../ui/sheet";
import { DynamicForm, type Value } from "./dynamic-form";

const result = JSON.stringify(
  {
    message: "Successfully gave 500 money to cursecode",
  },
  null,
  2,
);

export function RunSheet({
  runId,
  setRunId,
}: {
  setRunId: Dispatch<SetStateAction<string | undefined>>;
  runId: string | undefined;
}) {
  const router = useRouter();
  // get run
  const [values, setValues] = useState<Value[]>([]);
  const { project } = useProject();

  const args = [
    {
      id: "1",
      name: "player",
      type: "PLAYER",
      required: true,
      value: "333179113",
    },
    {
      id: "2",
      name: "amount",
      type: "NUMBER",
      required: true,
      value: "500",
    },
    {
      id: "3",
      name: "message",
      type: "STRING",
      required: false,
      value: "This is a test message",
    },
  ] as {
    id: string;
    name: string;
    type: ActionArgumentType;
    required: boolean;
    default: string | null;
    value?: string;
  }[];

  const { data: run, isLoading: isLoadingRun } = api.actions.getRun.useQuery(
    {
      projectId: router.query.id as string,
      runId: runId as string,
    },
    {
      refetchInterval: (data) => {
        if (data.state.data?.status === ActionRunStatus.PENDING) return 1000;
        return false;
      },
    },
  );

  return (
    <Sheet
      open={!!runId}
      onOpenChange={() => {
        setRunId(undefined);
        void router.replace(
          `/projects/${router.query.id as string}/actions/${router.query.actionId as string}`,
        );
      }}
    >
      <SheetContent className="overflow-y-scroll">
        {run && project ? (
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-x-2">
                <p className="text-lg font-semibold">
                  Run <span className="font-mono text-base">{run.id}</span>
                </p>
                <Badge color="green" size="xs">
                  {run.status}
                </Badge>
              </div>
              <SheetClose className="rounded-sm opacity-70  transition-opacity hover:opacity-100 focus:outline-none  disabled:pointer-events-none data-[state=open]:bg-secondary">
                <XMarkIcon className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </SheetClose>
            </div>

            <div className="mt-4 grid w-[calc(100%+24px)] -translate-x-3 grid-cols-1 gap-x-2 gap-y-2 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-neutral-600">Place</p>

                  <div className="flex items-center justify-between">
                    <Link
                      href={`https://roblox.com/games/${run.placeId}/blank`}
                      className="flex items-center gap-x-1  text-sm font-medium"
                    >
                      {/* <img
                    className="h-5 w-5 rounded-md border bg-neutral-100"
                    src={`https://thumbs.metrik.app/game/${123456}`}
                  /> */}
                      <span className="">PLACE NAME WIP</span>
                      <ArrowTopRightOnSquareIcon className="ml-0.5 h-4 w-4 shrink-0 text-neutral-900" />
                    </Link>
                  </div>
                </div>
                {run.placeId === project.placeId && (
                  <Badge color="gray" size="xs">
                    Root Place
                  </Badge>
                )}
              </div>
              <div className="w-[calc(100%+24px)] -translate-x-3 border-b"></div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-neutral-600">Place Version</p>
                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-x-2 text-sm font-medium tabular-nums">
                      {run.placeVersion}
                    </p>
                  </div>
                </div>
                <Badge color="blue" size="xs">
                  LATEST WIP
                </Badge>
              </div>
              <div className="w-[calc(100%+24px)] -translate-x-3 border-b"></div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-neutral-600">Servers</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm">
                      <span className="font-mono font-medium">
                        {crypto.randomUUID().split("-")[0]}
                      </span>
                      ,{" "}
                      <span className="font-mono font-medium">
                        {crypto.randomUUID().split("-")[0]}
                      </span>
                      , <span className="">6 more</span>
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="h-7 px-3">
                  See all
                </Button>
              </div>
              <div className="w-[calc(100%+24px)] -translate-x-3 border-b"></div>
              <div className="space-y-1">
                <p className="text-sm text-neutral-600">Ran by</p>
                <p className="flex items-center gap-x-1.5 text-sm font-medium">
                  
                  <img
                    className="h-4 w-4 rounded-full border bg-neutral-100"
                    src={`https://thumbs.metrik.app/headshot/${333179113}`}
                  />
                  RUN BY WIP
                </p>
              </div>
            </div>

            <div className="mt-4 ">
              <p className=" font-medium text-neutral-900">Arguments</p>
              <div className="mt-2 w-[calc(100%+24px)] -translate-x-3 rounded-lg border p-3">
                <DynamicForm
                  args={args}
                  values={values}
                  setValues={setValues}
                  readOnly
                />
              </div>
            </div>

            <div className="mt-4">
              <p className=" font-medium text-neutral-900">TRACES WIP</p>
              <ul
                role="list"
                className="mt-2 w-[calc(100%+24px)] -translate-x-3 space-y-5 rounded-lg border p-3"
              >
                <li className="relative flex gap-x-4">
                  <div className="absolute -bottom-5 left-0 top-0 flex w-6 justify-center">
                    <div className="w-px bg-neutral-200"></div>
                  </div>
                  <div className="relative flex h-6 w-6 flex-none items-center justify-center bg-white">
                    <div className="h-1.5 w-1.5 rounded-full bg-neutral-100 ring-1 ring-neutral-300"></div>
                  </div>
                  <p className="flex-auto py-0.5 text-xs leading-5 text-neutral-500">
                    <span className="inline-flex items-center gap-x-1 font-medium text-neutral-900">
                      <img
                        className="h-4 w-4 rounded-full border bg-neutral-100"
                        src={`https://thumbs.metrik.app/headshot/${333179113}`}
                      />
                      cursecode{" "}
                      <span className="font-normal text-neutral-500">
                        started the run.
                      </span>
                    </span>
                  </p>
                </li>
                <li className="relative flex gap-x-4">
                  <div className="absolute -bottom-5 left-0 top-0 flex w-6 justify-center">
                    <div className="w-px bg-neutral-200"></div>
                  </div>
                  <div className="relative flex h-6 w-6 flex-none items-center justify-center bg-white">
                    <div className="h-1.5 w-1.5 rounded-full bg-neutral-100 tabular-nums ring-1 ring-neutral-300"></div>
                  </div>
                  <p className="flex-auto py-0.5 text-xs leading-5 text-neutral-500">
                    Run published to{" "}
                    <span className="font-medium text-neutral-900">204</span>{" "}
                    servers.
                  </p>
                  <time
                    dateTime="2023-01-23T11:03"
                    className="flex-none py-0.5 text-xs leading-5 text-neutral-500"
                  >
                    took 1s
                  </time>
                </li>
                <li className="relative flex gap-x-4">
                  <div className="absolute -bottom-5 left-0 top-0 flex w-6 justify-center">
                    <div className="w-px bg-neutral-200"></div>
                  </div>
                  <div className="relative flex h-6 w-6 flex-none items-center justify-center bg-white">
                    <div className="h-1.5 w-1.5 rounded-full bg-neutral-100 ring-1 ring-neutral-300"></div>
                  </div>
                  <p className="flex-auto py-0.5 text-xs leading-5 text-neutral-500">
                    <span className="flex items-center">
                      <span className="mr-1 font-sans font-normal text-neutral-500">
                        Server
                      </span>
                      <Link
                        href={`/projects/${router.query.id as string}/servers/serverid`}
                        className="font-mono font-medium text-neutral-900"
                      >
                        ab40d437
                      </Link>
                      <Link
                        href={`/projects/${router.query.id as string}/servers/serverid`}
                        className="font-mono font-medium text-neutral-900"
                      >
                        <ArrowTopRightOnSquareIcon className="ml-0.5 h-3 w-3 text-neutral-900" />{" "}
                      </Link>
                      <span className="ml-1 font-sans font-normal text-neutral-500">
                        claimed the run.
                      </span>
                    </span>{" "}
                  </p>
                  <time
                    dateTime="2023-01-23T11:03"
                    className="flex-none py-0.5 text-xs leading-5 text-neutral-500"
                  >
                    took 3s
                  </time>
                </li>

                {/* <li className="relative flex gap-x-4">
                  <div className="absolute -bottom-5 left-0 top-0 flex w-6 justify-center">
                    <div className="w-px bg-neutral-200"></div>
                  </div>
                  <div className="relative flex h-6 w-6 flex-none items-center justify-center bg-white">
                    <LoaderIcon className="block h-3 w-3 animate-spin text-neutral-500" />
                  </div>
                  <p className="flex-auto py-0.5 text-xs leading-5 text-neutral-500">
                    Waiting...
                  </p>
                </li> */}
                <li className="relative flex gap-x-4">
                  <div className="absolute left-0 top-0 flex h-6 w-6 justify-center">
                    <div className="w-px bg-neutral-200"></div>
                  </div>
                  <div className="relative flex h-6 w-6 flex-none items-center justify-center rounded-full bg-white">
                    <CheckIcon className="block h-4 w-4 text-green-500" />
                  </div>
                  <p className="flex-auto py-0.5 text-xs leading-5 text-neutral-500">
                    Result received.
                  </p>
                  <time
                    dateTime="2023-01-24T09:20"
                    className="flex-none py-0.5 text-xs leading-5 text-neutral-500"
                  >
                    took 5s
                  </time>
                </li>
              </ul>
            </div>

            <div className="mt-4">
              <p className=" font-medium text-neutral-900">Result</p>
              <div className="mt-2 w-[calc(100%+24px)] -translate-x-3 overflow-clip rounded-lg border">
                <Code className="!rounded-none">{result}</Code>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <LoadingSpinner />
            {}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
