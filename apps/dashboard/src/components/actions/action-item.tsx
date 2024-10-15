import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import {
  MagnifyingGlassCircleIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/16/solid";
import { Badge, Card, Divider, TextInput } from "@tremor/react";
import { formatDistance } from "date-fns";

import { type ExtendedAction } from "@/pages/projects/[id]/actions";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Footer } from "../ui/footer";

export function ActionItem({
  action,
  actions,
}: {
  action: ExtendedAction;
  actions: ExtendedAction[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<ExtendedAction[]>(
    actions
      .filter((a) => a.place.id === action.place.id && a.key === action.key)
      .sort((a, b) => b.placeVersion - a.placeVersion),
  );
  const [parent] = useAutoAnimate();

  function search(term: string) {
    if (term === "") {
      setResults(
        actions
          .filter((a) => a.place.id === action.place.id && a.key === action.key)
          .sort((a, b) => b.placeVersion - a.placeVersion),
      );
      return;
    }

    setResults(
      actions
        .filter((a) => a.place.id === action.place.id && a.key === action.key)
        .filter((a) => String(a.placeVersion).startsWith(term))
        .sort((a, b) => b.placeVersion - a.placeVersion),
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="flex flex-col justify-start"
          style={{
            height:
              148 + actions.length < window.innerHeight
                ? `${148 + actions.length * 40}px`
                : `100vh`,
          }}
        >
          <div className="flex flex-col gap-y-3">
            <DialogTitle>Select version to run</DialogTitle>
            <TextInput
              className="h-9"
              icon={MagnifyingGlassIcon}
              onValueChange={search}
              placeholder="Search versions..."
            />
          </div>

          <div className="flex flex-col gap-y-2 overflow-y-scroll" ref={parent}>
            {results.map((a, i) => (
              <Link
                href={`/projects/${router.query.id as string}/actions/${a.id}`}
                key={a.id}
                className="flex h-9 items-center justify-start gap-x-2 rounded-lg px-3 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <div className="flex w-full items-center justify-between">
                  <p className="flex items-center gap-x-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-400">
                    <span>Version {a.placeVersion} </span>
                    {i === 0 && (
                      <Badge color="blue" size="xs" className="cursor-pointer">
                        Latest
                      </Badge>
                    )}
                    {a.placeVersion === 0 && (
                      <Badge color="red" size="xs" className="cursor-pointer">
                        Studio
                      </Badge>
                    )}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {action.serverIds.length} active server
                    {action.serverIds.length > 1 && "s"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      <Card
        key={action.id}
        className="cursor-pointer p-5"
        onClick={() => {
          if (
            actions.find(
              (a) =>
                a.place.id === action.place.id &&
                a.key === action.key &&
                a.id !== action.id,
            )
          ) {
            setOpen(true);
            return;
          }
          void router.push(
            `/projects/${router.query.id as string}/actions/${action.id}`,
          );
        }}
      >
        <div className="flex items-center justify-start gap-x-8">
          <div className="flex items-center">
            {/* <Tooltip>
                    <TooltipTrigger className="cursor-default">
                      <DynamicActionIcon />
                    </TooltipTrigger>
                    <TooltipContent>Dynamic Action</TooltipContent>
                  </Tooltip> */}

            <div className="">
              <h2 className="text-lg font-semibold">{action.name}</h2>
              <p className="font-mono text-sm text-neutral-500">{action.key}</p>
            </div>
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-medium text-neutral-500">Place</p>

            <p className="truncate text-sm text-neutral-700">Steve</p>
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-medium text-neutral-500">Version</p>

            <p className="truncate font-mono text-sm text-neutral-700">
              {action.placeVersion}
            </p>
          </div>
          {/* <div className="hidden lg:block">
                <p className="text-sm font-medium text-neutral-500">ID</p>

                <p className="truncate font-mono text-sm text-neutral-700">
                  {action.id}
                </p>
              </div> */}
          <div>
            <p className="text-sm font-medium text-neutral-500">Activated</p>
            <p className=" text-sm text-neutral-700">
              {formatDistance(action.activated, new Date(), {
                addSuffix: true,
              })}
            </p>
          </div>
          {/* <Button
                variant="primary"
                size="sm"
                onClick={() =>
                  void router.push(
                    `/projects/${router.query.id as string}/actions/${action.id}`,
                  )
                }
              >
                Run
              </Button> */}
        </div>

        <Footer height="h-12" paddingX="px-5">
          <p className="text-sm text-neutral-500 dark:text-white">
            Connected to {action.serverIds.length} server
            {action.serverIds.length > 1 && "s"}
          </p>
        </Footer>
      </Card>
    </>
  );
}
