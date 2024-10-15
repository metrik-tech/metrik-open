"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { Button, Card, Flex, TextInput } from "@tremor/react";
import { toast } from "sonner";

import { Footer } from "@/components/ui/footer";
import { useMembership } from "@/hooks/membership";
import { useStudio } from "@/hooks/studio";
import { api } from "@/utils/api";
import { useUploadThing } from "@/utils/uploadthing";
import { StudioAvatar } from "../../studio-avatar";
import { DeleteModal } from "./delete-modal";

export function GeneralTab() {
  const { currentStudio, isLoading } = useStudio();
  const [studioName, setStudioName] = useState<string>("");
  const { membership, isOwner } = useMembership();
  const [previewAvatarUrl, setPreviewAvatarUrl] = useState<string>("");
  const utils = api.useUtils();
  const router = useRouter();

  const {
    mutate: updateStudio,
    mutateAsync,
    isPending: isUpdating,
  } = api.studios.update.useMutation({
    onSuccess: async () => {
      await utils.studios.invalidate();
      await utils.studios.getAll.invalidate();
      await utils.studios.get.invalidate({
        id: currentStudio?.id as string,
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (currentStudio) {
      setStudioName(currentStudio.name);
    }
  }, [currentStudio]);

  function renameStudio() {
    if (currentStudio) {
      updateStudio({ id: currentStudio.id, name: studioName });
    } else {
      toast.error("Not finished loading, please wait to rename studio");
    }
  }

  const { startUpload } = useUploadThing("studioAvatarUpload", {
    onClientUploadComplete: (file) => {
      toast.success("Avatar uploaded");

      setPreviewAvatarUrl("");

      async function revalidate() {
        await utils.studios.invalidate();
        await utils.studios.getAll.invalidate();
        await utils.studios.get.invalidate({
          id: currentStudio?.id as string,
        });
      }
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      revalidate();
    },
  });

  return (
    <div className="relative space-y-4">
      <Card>
        <h4 className="font-display text-xl font-semibold">
          Studio Name & Avatar
        </h4>
        <p className="mb-3 mt-2 text-sm text-neutral-800 dark:text-neutral-400">
          Used to identify your studio on the Dashboard. Click on the preview
          image to upload a custom avatar from your files.
        </p>
        <div className="flex items-center justify-start gap-x-3">
          {currentStudio && !isLoading ? (
            <div className="relative h-14 w-14">
              <input
                type="file"
                disabled={!currentStudio || !membership || !isOwner}
                accept={"image/png, image/jpeg, image/jpg, image/svg+xml"}
                className="peer absolute inset-0 z-20 flex h-14 w-14 cursor-pointer select-none items-center justify-center rounded-full border text-transparent ring-offset-2 file:hidden focus:outline-none focus:ring-2 focus:ring-neutral-300 disabled:cursor-default  dark:ring-offset-dark-tremor-background dark:focus:ring-neutral-700"
                onChange={(event) => {
                  if (event.target.files?.[0]) {
                    if (!membership || !isOwner) {
                      toast.error(
                        "You do not have permission to change the avatar.",
                      );
                      return;
                    }

                    setPreviewAvatarUrl(
                      URL.createObjectURL(event.target.files[0]),
                    );

                    if (event.target.files[0].size > 2000000) {
                      toast.error("Avatar is too big. Maximum is 2MB.");
                      setPreviewAvatarUrl("");
                      return;
                    }

                    toast.promise(
                      startUpload([event.target.files[0]], {
                        studioId: currentStudio.id,
                      }),
                      {
                        loading: "Uploading avatar...",
                        error: "Failed to upload avatar",
                      },
                    );
                  }
                }}
              />
              <div className="pointer-events-none absolute inset-0 z-30 h-full w-full rounded-full transition-colors duration-200 peer-hover:bg-black/10 peer-disabled:bg-white/30 dark:peer-disabled:bg-black/30"></div>
              {previewAvatarUrl.length ? (
                <Image
                  src={previewAvatarUrl}
                  alt={currentStudio?.name}
                  width={56}
                  height={56}
                  className="aspect-square rounded-full"
                />
              ) : (
                <StudioAvatar
                  id={currentStudio?.id}
                  size="huge"
                  url={currentStudio?.avatarUrl}
                />
              )}
            </div>
          ) : (
            <div className="h-14 w-14 rounded-full border">
              <div className="h-full w-full animate-pulse rounded-full bg-neutral-100 dark:bg-neutral-800"></div>
            </div>
          )}
          <TextInput
            disabled={!currentStudio || !membership || !isOwner}
            value={studioName}
            className="max-w-sm"
            onChange={(event) => setStudioName(event.target.value)}
          />
        </div>

        <Footer>
          <Flex>
            <p className="text-sm text-neutral-500">
              Please use 30 characters at maximum.
            </p>
            <Button
              disabled={studioName === currentStudio?.name || !isOwner}
              loading={isUpdating}
              onClick={() => renameStudio()}
            >
              Save
            </Button>
          </Flex>
        </Footer>
      </Card>

      <Card>
        <h4 className="font-display text-xl font-semibold">Studio ID</h4>
        <p className="mb-3 mt-2 text-sm text-neutral-800 dark:text-neutral-400">
          Used when integrating Metrik with your experience.
        </p>
        <div className="h-9 w-fit rounded-lg border border-neutral-200 shadow-sm dark:border-border dark:text-neutral-200">
          {!isLoading && currentStudio ? (
            <button
              className="h-full w-full cursor-text px-3 text-left font-mono text-sm"
              onClick={() => {
                if (currentStudio) {
                  void navigator.clipboard.writeText(currentStudio?.id);
                  toast("Copied to clipboard");
                }
              }}
            >
              {currentStudio?.id ?? ""}
            </button>
          ) : (
            <button className="h-full w-64 animate-pulse bg-neutral-100 px-3 text-left font-mono text-sm dark:bg-neutral-800"></button>
          )}
        </div>
      </Card>

      <Card>
        <h4 className="font-display text-xl font-semibold">Danger Zone</h4>
        <p className="mb-3 mt-2 text-sm text-neutral-800 dark:text-neutral-400">
          This studio will be permanently deleted, including all projects and
          all their data. This action is irreversible and can not be undone.
        </p>
        <Footer>
          <Flex justifyContent="end">
            <DeleteModal
              studioName={currentStudio?.name as string}
              studioId={currentStudio?.id as string}
            />
          </Flex>
        </Footer>
      </Card>
    </div>
  );
}
