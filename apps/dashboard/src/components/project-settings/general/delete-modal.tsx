"use client";

import { useState, type Dispatch, type ReactNode } from "react";
import { useRouter } from "next/router";
import { Button } from "@tremor/react";
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

interface DeleteModalProps {
  projectName: string;
}

export function DeleteModal({ projectName }: DeleteModalProps) {
  const router = useRouter();
  const { currentStudio } = useStudio();
  const utils = api.useUtils();
  const [deleting, setDeleting] = useState<boolean>(false);
  const projectId = router.query.id as string;

  const { mutate } = api.projects.delete.useMutation({
    onSuccess: () => {
      toast.success(`Deleted project ${projectName}`);

      setDeleting(false);
      // await utils.project.byId.invalidate();
      // await utils.project.all.invalidate({ id: currentStudio?.id as string });

      // void router.push("/app");
    },
    onMutate: async () => {
      await utils.projects.get.cancel();

      await utils.projects.getAll.cancel({
        studioId: currentStudio?.id as string,
      });
    },
    onError: (error) => {
      setDeleting(false);
      toast.error(error.message);
    },
    onSettled: async () => {
      await utils.projects.invalidate();
      await utils.projects.getAll.refetch();
    },
  });

  function deleteProject() {
    setDeleting(true);
    mutate({ id: projectId });
  }

  return (
    <>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button color="red" loading={deleting}>
            Delete Project
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              <span className="font-medium">{projectName}</span> and all of its
              data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteProject} color="red">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
