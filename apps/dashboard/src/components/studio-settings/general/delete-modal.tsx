"use client";

import { useState, type Dispatch, type ReactNode } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";

import { Button } from "@/components/merlin/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useMembership } from "@/hooks/membership";
import { useStudio } from "@/hooks/studio";
import { api } from "@/utils/api";

interface DeleteModalProps {
  studioName: string;
  studioId: string;
}

export function DeleteModal({ studioName, studioId }: DeleteModalProps) {
  const router = useRouter();
  const utils = api.useUtils();
  const [deleting, setDeleting] = useState<boolean>(false);
  const { isOwner } = useMembership();
  const [open, setOpen] = useState(false);

  const { mutate } = api.studios.delete.useMutation({
    onSuccess: async () => {
      toast.success(`Deleted studio ${studioName}`);

      setDeleting(false);
      // await utils.project.byId.invalidate();
      // await utils.project.all.invalidate({ id: currentStudio?.id as string });

      void router.push("/");

      await utils.studios.getAll.refetch();
      await utils.studios.get.refetch();
      await utils.studios.getUsageLimits.refetch();
      localStorage.removeItem("persisted-studio");
    },
    onMutate: async () => {
      await utils.studios.getAll.cancel();
      await utils.studios.get.cancel();
    },
    onError: (error) => {
      setDeleting(false);
      toast.error(error.message);
    },
    onSettled: async () => {
      await utils.studios.invalidate();
    },
  });

  function deleteStudio() {
    setDeleting(true);
    setOpen(false);
    mutate({ id: studioId });
  }

  return (
    <>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" loading={deleting} disabled={!isOwner}>
            Delete Studio
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Studio</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              <span className="font-medium">{studioName}</span> from our
              servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="ghost"
              className="text-neutral-500"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={deleteStudio} variant="destructive">
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
