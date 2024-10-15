"use client";

import { useEffect, useState, type ReactElement } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Card, Flex, TextInput } from "@tremor/react";

import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/merlin/button";
import { PageWrapper } from "@/components/page-wrapper";

const errors = {
  state_empty:
    "Internal login session state is invalid or expired. Please try again.",
  tokens_invalid:
    "Invalid authorization code provided by Roblox. Please try again.",
  resources_api_error:
    "An error occurred while fetching resources from Roblox. Please try again.",
  resources_not_granted:
    "You have not granted access to the Roblox resources required for this project. Please try again.",
  project_already_exists:
    "A project is already connected to this Roblox experience. Please try again with a different experience.",
  create_not_allowed: "You cannot create a new project for with Reauth.",
};

export default function CreateProject() {
  const router = useRouter();
  const { error } = router.query;

  const message =
    errors[error as keyof typeof errors] ?? "An unknown error occurred.";

  return (
    <Flex className="pb-8 pt-64" justifyContent="center">
      <div className="text-center">
        <div>
          <h1 className="text-4xl font-semibold">
            Project {error === "create_not_allowed" ? "reauth" : "creation"}{" "}
            failed
          </h1>
          <p className="mt-3 max-w-md text-sm text-neutral-500 dark:text-neutral-400">
            {message}
          </p>
        </div>
        <div>
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
          <Button asChild className="mt-4">
            <Link href="/new/project">Create a new project</Link>
          </Button>
        </div>
      </div>
    </Flex>
  );
}

CreateProject.PageWrapper = PageWrapper;
CreateProject.getLayout = (page: ReactElement) => {
  return (
    <AppLayout tab="projects" title="Project Creation Failed">
      {page}
    </AppLayout>
  );
};
