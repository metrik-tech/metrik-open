import { useEffect, useState, type Dispatch, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ClipboardIcon,
  HomeIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/16/solid";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import {
  Card,
  NumberInput,
  Select,
  SelectItem,
  TextInput,
} from "@tremor/react";
import { format } from "date-fns";

import { type ActionArgumentType } from "@metrik/db/client";

import { DynamicForm, type Value } from "@/components/actions/dynamic-form";
import { PlayerSearch } from "@/components/actions/player-search";
import { RunSheet } from "@/components/actions/run-sheet";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/merlin/button";
import { NoLanguageCode } from "@/components/no-lang-code";
import { PageWrapper } from "@/components/page-wrapper";
import { PopoverAnchor } from "@/components/ui/popover";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { api } from "@/utils/api";
import { cn } from "@/utils/cn";

const args = [
  {
    id: "1",
    name: "player",
    type: "PLAYER",
    required: true,
  },
  {
    id: "2",
    name: "amount",
    type: "NUMBER",
    required: true,
    default: "500",
  },
  {
    id: "3",
    name: "message",
    type: "STRING",
    required: false,
  },
  {
    id: "4",
    name: "player",
    type: "PLAYER",
    required: true,
  },
  {
    id: "5",
    name: "amount",
    type: "NUMBER",
    required: true,
    default: "500",
  },
  {
    id: "6",
    name: "message",
    type: "STRING",
    required: false,
  },
] as {
  id: string;
  name: string;
  type: ActionArgumentType;
  required: boolean;
  default: string | undefined;
}[];

interface Arg {
  id: string;
  name: string;
  type: ActionArgumentType;
  required: boolean;
  default: string | undefined;
}

export default function ActionPage() {
  const router = useRouter();
  const [values, setValues] = useState<Value[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | undefined>();
  const [run, setRun] = useState<string | undefined>();

  const { data: action, isLoading: isActionLoading } = api.actions.get.useQuery(
    {
      projectId: router.query.id as string,
      actionId: router.query.actionId as string,
    },
    {
      enabled: !!router.query.actionId && !!router.query.id,
    },
  );

  const { mutate: runAction, isPending: isRunning } =
    api.actions.run.useMutation({
      onSuccess: async (data) => {
        await router.replace(
          `/projects/${router.query.id as string}/actions/${router.query.actionId as string}?run=${data?.runId}`,
        );
      },
    });

  useEffect(() => {
    if (action) {
      setValues(
        action.arguments
          .map((arg) => {
            if (!arg.default) {
              return undefined;
            }
            return {
              name: arg.name,
              type: arg.type,
              value: arg.default,
            };
          })
          .filter((arg) => arg !== undefined) as Value[],
      );
    }

    return;
  }, [action]);

  useEffect(() => {
    if (router.query.run) {
      setRun(router.query.run as string);
    }
  }, [router.query.run]);

  {
    /* 
        Needs:
        - Action name
        - Parameters
            - Required
            - Type
            - Default
            - For boolean have it as a select
            - For numbers have it as a Tremor number component
            - String vs. textarea?
            
        - Result area
            - Copy to clipboard
        - Small history of runs/triggers
    */
  }

  // TWO COLUMNS: INPUT AND RUN HISTORY
  // LEFT COLUMN STARTS WITH INPUT THEN IS LIKE A PLANETSCALE DEPLOY REQUEST
  // INPUT
  // THEN RUN STARTED
  // THEN RUN CLAIMED
  // (RUN FAILED)

  return (
    <div className="pb-4">
      <Link
        href={`/projects/${router.query.id as string}/actions`}
        className="group relative inline-flex items-center text-sm text-blue-500 transition-colors duration-200"
      >
        <ArrowLeftIcon className="mr-1 h-4 w-4" />
        Back to Actions
        {/* underline */}
        <div className="absolute -bottom-0.5 left-0 hidden h-[1px] w-full bg-blue-500 group-hover:block" />
      </Link>

      <RunSheet runId={run} setRunId={setRun} />

      {isActionLoading && <div>Loading...</div>}

      {!isActionLoading && action && (
        <div className="relative mt-4 overflow-clip rounded-xl border bg-white dark:bg-dark-tremor-background-muted">
          <div className="border-b p-5">
            <h1 className=" text-2xl font-medium">{action.name}</h1>
            <p className="font-mono text-sm text-neutral-500">{action.key}</p>
          </div>
          <div className="bg-neutral-50 p-5 dark:bg-dark-tremor-background">
            <div className="grid gap-5 lg:grid-cols-1">
              <div className="flex max-h-[500px] flex-col gap-y-3">
                <div className="relative grow overflow-y-scroll rounded-lg border bg-white dark:bg-dark-tremor-background-muted">
                  <div className="sticky top-0 z-10 border-b bg-white p-3 dark:bg-dark-tremor-background-muted">
                    <h2 className="inline rounded-md bg-neutral-100 px-2 py-1 text-sm  dark:bg-dark-tremor-background-subtle">
                      Input
                    </h2>
                  </div>

                  <div className="p-3">
                    <DynamicForm
                      args={action.arguments}
                      values={values}
                      setValues={setValues}
                    />
                  </div>

                  <div className="sticky bottom-0 z-10 hidden items-center justify-between border-t bg-white p-3 dark:bg-dark-tremor-background-muted lg:flex">
                    <Button variant="outline">Reset Default</Button>
                    <div className="flex items-center justify-end space-x-3">
                      <p className="text-xs text-neutral-600">
                        {result ? "235" : "236"} Action runs remaining
                      </p>
                      <Button
                        suffix={PaperAirplaneIcon}
                        onClick={() =>
                          runAction({
                            placeId: Number(action.placeId),
                            projectId: router.query.id as string,
                            key: action.key,
                            arguments: values,
                            exclusive: false,
                            serverIds: undefined,
                            placeVersion: action.placeVersion,
                          })
                        }
                        loading={isRunning}
                      >
                        Run action
                      </Button>
                    </div>
                  </div>
                  <div className="sticky bottom-0 z-10 grid gap-3 border-t bg-white p-3 dark:bg-dark-tremor-background-muted lg:hidden">
                    <Button size="sm" variant="outline">
                      Reset Default
                    </Button>
                    <Button size="sm" suffix={PaperAirplaneIcon}>
                      Run action
                    </Button>
                  </div>
                </div>
                {/* <Button
                fullWidth
                className="hidden shrink-0 py-2 lg:flex"
                suffix={PaperAirplaneIcon}
                loading={isLoading}
                onClick={run}
              >
                Run
              </Button> */}
              </div>

              <div className="relative hidden max-h-[500px] overflow-y-scroll rounded-lg border bg-white dark:bg-dark-tremor-background-muted">
                <div className="sticky right-0 top-0 z-10 flex items-center justify-between border-b bg-white p-3 dark:bg-dark-tremor-background-muted">
                  <h2 className="inline rounded-md bg-neutral-100 px-2 py-1 text-sm  dark:bg-dark-tremor-background-subtle">
                    Output
                  </h2>
                  <button className="flex items-center rounded-md px-2 py-1 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-400 hover:dark:bg-dark-tremor-background-subtle">
                    <ClipboardIcon className="mr-1 h-3 w-3" />
                    <span>Copy to clipboard</span>
                  </button>
                </div>

                <div className="break-words p-3 font-mono text-sm">
                  <pre>
                    {result
                      ? JSON.stringify(result, null, 2)
                      : "Run action to get a result"}
                  </pre>
                </div>
              </div>
            </div>
            <div className="mt-4 overflow-y-scroll rounded-lg border bg-white dark:bg-dark-tremor-background-muted">
              <div className="sticky top-0 z-10 border-b bg-white p-3 dark:bg-dark-tremor-background-muted">
                <h2 className="inline rounded-md bg-neutral-100 px-2 py-1 text-sm  dark:bg-dark-tremor-background-subtle">
                  Run History
                </h2>
              </div>
              <div className="grid divide-y">
                {result && (
                  <div className="flex items-center justify-between p-3">
                    <div className="w-[10rem]">
                      <p className="mb-2 text-sm font-medium text-neutral-600">
                        Run by
                      </p>
                      <div className="flex items-center space-x-2">
                        <img
                          src="https://thumbs.metrik.app/headshot/333179113"
                          className="h-6 w-6 rounded-full border bg-neutral-100"
                        />
                        <span className="truncate text-sm font-medium">
                          @cursecode
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-sm font-medium text-neutral-600">
                        Output
                      </p>
                      <p className="w-[22rem] truncate font-mono text-sm">
                        Successfully gave 2000 money to @cursecode
                      </p>
                    </div>
                    <div className="w-[12rem]">
                      <p className="mb-2 text-sm font-medium text-neutral-600">
                        Timestamp
                      </p>
                      <p className="text-sm">
                        {format(new Date(), "MMMM d, h:mm a")}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost">
                      View Details
                    </Button>
                  </div>
                )}
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="w-[10rem]">
                    <p className="mb-2 text-sm font-medium text-neutral-600">
                      Run by
                    </p>
                    <div className="flex items-center space-x-2">
                      <img
                        src="https://thumbs.metrik.app/headshot/1012243713"
                        className="h-6 w-6 rounded-full border bg-neutral-100"
                      />
                      <span className="truncate text-sm font-medium">
                        @Cookie_DevX
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium text-neutral-600">
                      Output
                    </p>
                    <p className="w-[22rem] truncate font-mono text-sm">
                      Successfully gave 3500 money to @estynva
                    </p>
                  </div>
                  <div className="w-[12rem]">
                    <p className="mb-2 text-sm font-medium text-neutral-600">
                      Timestamp
                    </p>
                    <p className="text-sm">February 19, 4:42 AM</p>
                  </div>
                  <Button size="sm" variant="ghost">
                    View Details
                  </Button>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="w-[10rem]">
                    <p className="mb-2 text-sm font-medium text-neutral-600">
                      Run by
                    </p>
                    <div className="flex items-center space-x-2">
                      <img
                        src="https://thumbs.metrik.app/headshot/1441032575"
                        className="h-6 w-6 rounded-full border bg-neutral-100"
                      />
                      <span className="truncate text-sm font-medium">
                        @AsynchronousMatrix
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium text-neutral-600">
                      Output
                    </p>
                    <p className="w-[22rem] truncate font-mono text-sm">
                      Successfully gave 50000 money to @brandonblahaj
                    </p>
                  </div>
                  <div className="w-[12rem]">
                    <p className="mb-2 text-sm font-medium text-neutral-600">
                      Timestamp
                    </p>
                    <p className="text-sm">February 17, 6:16 PM</p>
                  </div>
                  <Button size="sm" variant="ghost">
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

ActionPage.PageWrapper = PageWrapper;
ActionPage.getLayout = function getLayout(page: ReactNode) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const router = useRouter();
  return (
    <AppLayout tab="actions" project>
      {page}
    </AppLayout>
  );
};

export interface User {
  userId: number;
  avatarUrl: string;
  username: string;
  displayName: string;
  idMatch: boolean;
}
