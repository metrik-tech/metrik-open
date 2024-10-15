"use client";

import { useEffect, useState, type ReactElement } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Card, Flex, TextInput } from "@tremor/react";
import { toast } from "sonner";
import { create } from "zustand";

import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/merlin/button";
import { PageWrapper } from "@/components/page-wrapper";
import { Input } from "@/components/ui/input";
import StudioProvider, { useStudio } from "@/hooks/studio";
import { api } from "@/utils/api";
import config from "@/utils/config";

interface NewProject {
  name: string;
  // placeId?: string;
  // openCloudToken: string;
  nameError?: string;
  // placeIdError?: string;
  // openCloudTokenError?: string;
  update: (state: OptionalNewProject) => void;
}

interface OptionalNewProject {
  name?: string;
  // placeId?: string;
  // openCloudToken?: string;
  nameError?: string;
  // placeIdError?: string;
  // openCloudTokenError?: string;
}

const useNewProject = create<NewProject>((set) => ({
  name: "",
  // placeId: "",
  // openCloudToken: "",
  nameError: undefined,
  // placeIdError: undefined,
  // openCloudTokenError: undefined,

  update: (state: OptionalNewProject) =>
    set((prev: NewProject) => ({ ...prev, ...state }) as NewProject),
}));

export default function CreateProject() {
  const { allStudios, isLoading, currentStudio } = useStudio();
  const {
    name,
    // placeId,
    nameError,
    // openCloudToken,
    // openCloudTokenError,
    // placeIdError,
    update,
  } = useNewProject<NewProject>((state) => state);
  const router = useRouter();
  const utils = api.useUtils();

  const { mutate, isPending: isMutating } = api.projects.create.useMutation({
    onSuccess: async (url) => {
      await router.push(url);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    update({
      nameError: undefined,
      // placeIdError: undefined,
      // openCloudTokenError: undefined,
    });
  }, [name, update]);

  const createProject = () => {
    if (!name) {
      update({
        nameError: "Name is required",
      });
      return;
    }

    // if (!placeId) {
    //   update({
    //     placeIdError: "Place ID is required",
    //   });
    //   return;
    // }

    // if (isNaN(parseInt(placeId))) {
    //   update({
    //     placeIdError: "Place ID must be a number",
    //   });
    //   return;
    // }

    // if (!openCloudToken) {
    //   update({
    //     openCloudTokenError: "Open Cloud Token is required",
    //   });
    //   return;
    // }

    if (name && name.trim().length < 3) {
      update({
        nameError: "Name must be at least 3 characters",
      });
      return;
    }

    if (name && name.trim().length >= 30) {
      update({
        nameError: "Name must be less than 30 characters",
      });
      return;
    }

    if (name && !isLoading && currentStudio) {
      mutate({
        name,

        studioId: currentStudio.id,
      });
    }
  };

  return (
    <div className="h-full items-center justify-center">
      <div className="flex h-full flex-col items-center justify-center text-center">
        <div>
          <h1 className="text-4xl font-semibold">Create a new project</h1>
          <p className="mt-3 max-w-md text-sm text-neutral-500 dark:text-neutral-400">
            Projects connect to Roblox experiences. Any Place ID can be inserted
            from the experience but the root Place ID will be used.
          </p>
        </div>
        <div className="w-[20rem]">
          <div className="mx-auto mt-8 max-w-xs">
            <p className="mb-1 text-left text-xs text-neutral-700 dark:text-neutral-400">
              Project Name
            </p>
            <TextInput
              value={name}
              error={!!nameError}
              errorMessage={nameError}
              onValueChange={(value: string) =>
                update({
                  name: value,
                })
              }
              placeholder={"Speed Run 4"}
              className="max-w-none sm:max-w-md"
              maxLength={30}
              minLength={3}
            />
          </div>
          {/* <div className="mt-4">
              <p className="mb-1 text-xs text-neutral-600 dark:text-neutral-400">
                Place ID
              </p>
              <TextInput
                value={placeId}
                error={!!placeIdError}
                errorMessage={placeIdError}
                onValueChange={(value: string) =>
                  update({
                    placeId: value,
                  })
                }
                placeholder={"183364845"}
                className="max-w-none sm:max-w-md"
                max={12}
              />
            </div> */}

          {/* <div className="mt-4">
              <p className="mb-1 text-xs text-neutral-600 dark:text-neutral-400">
                Open Cloud Token
              </p>
              <TextInput
                value={openCloudToken}
                error={!!openCloudTokenError}
                errorMessage={openCloudTokenError}
                onValueChange={(value: string) =>
                  update({
                    openCloudToken: value,
                  })
                }
                placeholder="•••••••••••••••••••••••••"
                className="max-w-none sm:max-w-md"
                type="password"
              />
              <p className="mt-1 text-left text-xs text-neutral-600">
                Please follow our guide on how to create and get your token{" "}
                <Link
                  href={`${config.docsUrl}guides/place-id`}
                  className="text-blue-500"
                  target="_blank"
                >
                  here
                </Link>
              </p>
            </div> */}

          <Button
            loading={isMutating}
            className="mt-4 w-full max-w-xs"
            onClick={createProject}
          >
            Create
          </Button>
        </div>
      </div>
    </div>
  );
}

CreateProject.PageWrapper = PageWrapper;
CreateProject.getLayout = (page: ReactElement) => {
  return (
    <AppLayout tab="projects" title="Create Project">
      {page}
    </AppLayout>
  );
};
