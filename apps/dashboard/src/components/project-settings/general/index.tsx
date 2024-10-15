"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowTopRightOnSquareIcon, LinkIcon } from "@heroicons/react/16/solid";
import { Card, Divider, Flex, Text, TextInput, Title } from "@tremor/react";
import { toast } from "sonner";

import type { Project } from "@metrik/db/client";

import { Button } from "@/components/merlin/button";
import { Footer } from "@/components/ui/footer";
import { api } from "@/utils/api";
import { useMembership } from "../../hooks/membership";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import { DeleteModal } from "./delete-modal";

interface GeneralTabProps {
  project: Project;
  experience:
    | {
        name: string;
        creatorType: "User" | "Group";
        creatorId: string;
        creatorName: string;
      }
    | undefined;
}

export function GeneralTab({ project, experience }: GeneralTabProps) {
  const [projectName, setProjectName] = useState<string>("");
  const utils = api.useUtils();
  const { isOwner } = useMembership();

  const { mutate: updateProject, isPending: isUpdating } =
    api.projects.update.useMutation({
      onSuccess: async () => {
        toast.success("Project name updated");

        await utils.projects.invalidate();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  const projectIdRef = useRef(null);

  useEffect(() => {
    if (project) {
      setProjectName(project.name);
    }
  }, [project]);

  function renameProject() {
    if (project && projectName) {
      updateProject({
        id: project.id,
        name: projectName,
      });
    } else if (!projectName) {
      toast.error("Please enter a project name");
    } else {
      toast.error("Not finished loading, please wait to rename project");
    }
  }
  return (
    <div className="space-y-8">
      <Card>
        <h4 className="font-display text-xl font-semibold">Project Name</h4>
        <p className="mb-3 mt-2 text-sm text-neutral-800 dark:text-neutral-400">
          Used to identify your project on the Dashboard.
        </p>
        <TextInput
          disabled={!project || isUpdating || !isOwner}
          value={projectName}
          className="max-w-sm"
          onChange={(event) => setProjectName(event.target.value)}
        />
        <Footer>
          <Flex>
            <p className="text-sm text-neutral-500">
              Please use 30 characters at maximum.
            </p>
            <Button
              disabled={projectName === project?.name || !project || !isOwner}
              loading={isUpdating}
              onClick={renameProject}
            >
              Save
            </Button>
          </Flex>
        </Footer>
      </Card>
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h4 className="font-display text-xl font-semibold">
              Connected Experience
            </h4>
            <p className="mt-2 text-sm text-neutral-800 dark:text-neutral-400">
              The Roblox experience that is connected to this Metrik project.
              This cannot be changed.
            </p>
          </div>
          {project && (
            <Button asChild size="sm" suffix={LinkIcon}>
              <Link href={`/api/projects/reauth?projectId=${project.id}`}>
                Reauthenticate
              </Link>
            </Button>
          )}
        </div>

        <Divider />

        <div className="flex items-start justify-start space-x-3">
          {project ? (
            <Image
              src={`https://thumbs.metrik.app/game/${project.universeId}`}
              height={96}
              width={96}
              alt={`${project.universeId}`}
              className="rounded-md border text-xs"
            />
          ) : (
            <div className="h-24 w-24 animate-pulse rounded-md border bg-neutral-200 text-xs"></div>
          )}

          <div>
            {experience && project ? (
              <Flex justifyContent="start">
                <h5 className="text-lg font-medium">{experience.name}</h5>
                <Link
                  href={`https://www.roblox.com/games/${project?.placeId}`}
                  target="_blank"
                >
                  <ArrowTopRightOnSquareIcon className="ml-1 h-[1.15rem] w-[1.15rem] text-blue-600" />
                </Link>
              </Flex>
            ) : (
              <div className="mb-2 animate-pulse">
                <div className="w-46 h-5 animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-700"></div>
              </div>
            )}
            <div className="flex items-center space-x-1 text-sm text-neutral-600 dark:text-neutral-300">
              <span>By</span>
              {experience ? (
                <Link
                  className="font-medium text-neutral-700 dark:text-neutral-300"
                  href={
                    experience.creatorType === "User"
                      ? `https://www.roblox.com/users/${
                          experience.creatorId || ""
                        }/profile`
                      : `https://www.roblox.com/groups/${
                          experience.creatorId || ""
                        }`
                  }
                  target="_blank"
                >
                  {experience.creatorName}
                </Link>
              ) : (
                <span className="animate-pulse">
                  <div className="h-3 w-24 animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-700"></div>
                </span>
              )}
              {/* ) : (
                <span className="inline animate-pulse">
                  <div className="h-3.5 w-32 rounded-md bg-neutral-200"></div>
                </span>
              )} */}
            </div>

            <div className="text-xs dark:text-neutral-300">
              <div className="flex items-center space-x-1 py-0.5">
                <span className="font-medium">Root Place ID:</span>
                {project && experience ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className=" inline rounded font-mono"
                        onClick={() => {
                          void navigator.clipboard.writeText(project?.placeId);
                          toast("Copied Place ID to clipboard");
                        }}
                      >
                        {project?.placeId}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Click to copy</TooltipContent>
                  </Tooltip>
                ) : (
                  <span className="animate-pulse">
                    <div className="h-2 w-20 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700"></div>
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-1 py-0.5">
                <span className="font-medium">Universe ID:</span>{" "}
                {project && experience ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className="inline rounded font-mono"
                        onClick={() => {
                          void navigator.clipboard.writeText(
                            project?.universeId,
                          );
                          toast("Copied Universe ID to clipboard");
                        }}
                      >
                        {project?.universeId}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Click to copy</TooltipContent>
                  </Tooltip>
                ) : (
                  <span className="animate-pulse">
                    <div className="h-2 w-24 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700"></div>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
      <Card>
        <h4 className="font-display text-xl font-semibold">Project ID</h4>
        <p className="mb-3 mt-2 text-sm text-neutral-800 dark:text-neutral-400">
          Used when integrating Metrik with the Metrik API or your experience.
        </p>
        <div className="w-fit rounded-lg border border-neutral-200 shadow-sm dark:border-neutral-700">
          <button
            className="h-full w-full cursor-text px-3 py-2 text-left"
            onClick={() => {
              if (project) {
                void navigator.clipboard.writeText(project?.id);
                toast("Copied Project ID to clipboard");
              }
            }}
          >
            <pre className="text-sm" ref={projectIdRef}>
              {project?.id}
            </pre>
          </button>
        </div>
      </Card>
      <Card>
        <h4 className="font-display text-xl font-semibold">Danger Zone</h4>
        <p className="mb-3 mt-2 text-sm text-neutral-800 dark:text-neutral-400">
          The project will be permanently deleted, including its analytics and
          logs. This action is irreversible and can not be undone.
        </p>
        <Footer>
          <Flex justifyContent="end">
            <DeleteModal projectName={project?.name} />
          </Flex>
        </Footer>
      </Card>
    </div>
  );
}
