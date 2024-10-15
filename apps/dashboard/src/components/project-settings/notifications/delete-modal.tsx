"use client";

import { useState, type Dispatch, type ReactNode } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";

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
import { useStudio } from "@/hooks/studio";
import { api } from "@/utils/api";

interface DeleteNotificationModalProps {
  channelName: string;
  channelId: string;
  children: ReactNode;
}

export function DeleteNotificationModal({
  channelName,
  channelId,
  children,
}: DeleteNotificationModalProps) {
  const router = useRouter();
  const { currentStudio } = useStudio();
  const utils = api.useUtils();
  const [open, setOpen] = useState(false);

  const { mutateAsync } = api.channels.delete.useMutation({
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: async () => {
      await utils.channels.invalidate();
    },
  });

  function deleteChannel() {
    toast.promise(mutateAsync({ id: channelId }), {
      loading: "Deleting channel...",
      success: (data) => {
        setOpen(false);
        return `Successfully deleted channel ${data.nickname}.`;
      },
    });
  }

  return (
    <>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notification Channel</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              notification channel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteChannel} color="red">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
