import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { GlobeAmericasIcon } from "@heroicons/react/20/solid";
import { Button } from "@tremor/react";
import CodeInput, { type AuthCodeRef } from "react-auth-code-input";
import { toast } from "sonner";
import { create } from "zustand";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useStudio } from "@/hooks/studio";
import { api } from "@/utils/api";
import { cn } from "@/utils/cn";
import config from "@/utils/config";
import type { ValidEvents, ValidServices } from "@/utils/config";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface Form {
  code: string;
  codeError: string | undefined;
  update: (state: OptionalForm) => void;
}

interface OptionalForm {
  code?: string;
  codeError?: string | undefined;
}

const useFormStore = create<Form>((set) => ({
  code: "",
  codeError: undefined,

  update: (state: OptionalForm) =>
    set((prev: Form) => ({ ...prev, ...state }) as Form),
}));

export function JoinStudioModal({ trigger }: { trigger: ReactNode }) {
  const router = useRouter();
  const utils = api.useUtils();
  const [open, setOpen] = useState(false);
  const { currentStudio, setCurrentStudio, allStudios } = useStudio();
  const codeInputRef = useRef<AuthCodeRef>(null);

  const form = useFormStore<Form>((state) => state);

  const updateForm = form.update;

  const { mutate, isPending: isLoading } = api.invites.use.useMutation({
    onSuccess: async (data) => {
      if (router.pathname === "/onboarding") {
        await router.push("/");
        return;
      }

      toast.success(`Joined studio ${data.name}`);

      onOpenChange(false);

      await utils.studios.invalidate();
      await utils.invites.invalidate();

      const studio = allStudios.find((s) => s.id === data.id);

      if (studio) {
        setCurrentStudio(studio);
      }
    },

    onError: (error) => {
      if (error.message === "No invite found") {
        updateForm({
          codeError: "No invite found",
        });
      } else if (error.message === "You are already a member of this studio") {
        updateForm({
          codeError: "You are already a member of this studio",
        });
      } else if (
        error.data?.httpStatus === 429 ??
        error.message.startsWith("Slow down")
      ) {
        updateForm({
          codeError: "Slow down! Try again in a few seconds",
        });
      } else {
        toast.error(error.message);
      }
    },
  });

  function onOpenChange(open: boolean) {
    setOpen(open);
    if (!open) {
      updateForm({
        code: "",
      });

      return;
    } else {
      codeInputRef.current?.focus();
    }
  }

  function joinStudio() {
    if (form.code.length > 8 || form.code.length < 8) {
      updateForm({
        codeError: "Invite code is 8 characters long",
      });
      return;
    }

    mutate({
      code: form.code,
    });
    return;
  }

  useEffect(() => {
    updateForm({
      codeError: undefined,
    });
  }, [form.code, updateForm]);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-center font-display text-2xl">
            Join a studio
          </DialogTitle>

          <p className="mx-auto max-w-sm pb-4 text-center text-sm text-neutral-600 dark:text-neutral-500">
            Ask your teammate for an invite code, then enter it here. Invite
            codes are 8 alphanumeric characters long.
          </p>

          {/* <Input
            value={form.nickname}
            error={form.nicknameError}
            marginTop="mt-2"
            label="Nickname"
            placeholder="Team Form"
            onChange={(event) =>
              updateForm({
                nickname: event.target.value,
              })
            }
          /> */}

          <div className="mt-8"></div>

          <CodeInput
            onChange={(code) => updateForm({ code })}
            ref={codeInputRef}
            inputClassName="w-8 h-8 mr-2 text-base sm:w-10 sm:h-10 sm:mr-3 sm:text-xl font-display text-center uppercase rounded-md border border-border focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-600/70 focus:border-transparent shadow-sm bg-transparent p-2"
            containerClassName="flex flex-row items-center justify-center"
            length={8}
          />

          <p
            className={cn(
              "translate-y-0.5 text-center text-xs text-red-500",
              !form.codeError && "opacity-0",
            )}
          >
            {form.codeError ?? "X"}
          </p>
        </DialogHeader>
        <DialogFooter>
          <Button
            className="w-full"
            loading={isLoading}
            onClick={joinStudio}
            loadingText="Hang on..."
          >
            Join studio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
