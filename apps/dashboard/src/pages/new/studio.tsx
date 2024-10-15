"use client";

import { useEffect, useState, type ReactElement } from "react";
import { useRouter } from "next/router";
import { Button, Card, Flex, TextInput } from "@tremor/react";
import { toast } from "sonner";
import { create } from "zustand";

import { AppLayout } from "@/components/app-layout";
import { PageWrapper } from "@/components/page-wrapper";
import { useStudio } from "@/hooks/studio";
import { api } from "@/utils/api";
import getStripe from "@/utils/stripejs";

interface NewStudio {
  name?: string;
  nameError?: string;
  update: (state: OptionalNewStudio) => void;
}

interface OptionalNewStudio {
  name?: string;
  nameError?: string;
}

const useNewStudio = create<NewStudio>((set) => ({
  name: undefined,
  nameError: undefined,

  update: (state: OptionalNewStudio) =>
    set((prev: NewStudio) => ({ ...prev, ...state }) as NewStudio),
}));

export default function CreateStudio() {
  const { allStudios, isLoading, currentStudio, setCurrentStudio } =
    useStudio();
  const { name, nameError, update } = useNewStudio<NewStudio>((state) => state);
  const router = useRouter();
  const utils = api.useUtils();

  const { mutate, isPending: isMutating } =
    api.billing.createStudioCheckoutSession.useMutation({
      onSuccess: async (opts) => {
        const stripe = await getStripe();

        await stripe?.redirectToCheckout({ sessionId: opts.sessionId });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  useEffect(() => {
    update({
      nameError: undefined,
    });
  }, [name, update]);

  const createStudio = () => {
    if (!name) {
      update({
        nameError: "Name is required",
      });
      return;
    }

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
        studioName: name,
      });
    }
  };

  return (
    <Flex className="mt-28" justifyContent="center">
      <div className="text-center">
        <div>
          <h1 className="text-4xl font-semibold">Create a new studio</h1>
          <p className="mt-3 max-w-md text-sm text-neutral-500">
            Studios are containers for your projects. They do not link to
            anything on Roblox. Once you have created your project, you can
            invite your team members using Invite Codes.
          </p>
        </div>
        <div>
          <Card className="mt-8">
            <div>
              <p className="mb-1 text-xs text-neutral-600 dark:text-neutral-400">
                Studio Name
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
                placeholder={"Awesome Studios"}
                className="max-w-none sm:max-w-md"
                maxLength={30}
                minLength={3}
              />
            </div>
          </Card>
          <Button
            loading={isMutating}
            className="mt-6 w-full max-w-xs"
            size="xl"
            onClick={createStudio}
          >
            Create
          </Button>
        </div>
      </div>
    </Flex>
  );
}

CreateStudio.PageWrapper = PageWrapper;
CreateStudio.getLayout = (page: ReactElement) => {
  return (
    <AppLayout tab="projects" title="Create Studio">
      {page}
    </AppLayout>
  );
};
