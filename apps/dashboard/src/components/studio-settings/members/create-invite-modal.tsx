"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/router";
import Tooltip from "@tippyjs/react";
import {
  Button,
  NumberInput,
  Switch,
  Tab,
  TabGroup,
  TabList,
  TextInput,
} from "@tremor/react";
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
import { api } from "@/utils/api";
import config from "@/utils/config";
import type { ValidEvents, ValidServices } from "@/utils/config";
import { useStudio } from "../../hooks/studio";

interface Invite {
  nickname: string;
  limitedUses: boolean;
  usesRemaining: number | undefined;
  nicknameError: string | undefined;
  usesRemainingError: string | undefined;
  update: (state: OptionalInvite) => void;
}

interface OptionalInvite {
  nickname?: string;
  limitedUses?: boolean;
  usesRemaining?: number | undefined;
  nicknameError?: string | undefined;
  usesRemainingError?: string | undefined;
}

const useInviteStore = create<Invite>((set) => ({
  nickname: "",
  limitedUses: false,
  nicknameError: undefined,
  usesRemaining: undefined,
  usesRemainingError: undefined,

  update: (state: OptionalInvite) =>
    set((prev: Invite) => ({ ...prev, ...state }) as Invite),
}));

export function NewInviteModal() {
  const router = useRouter();
  const utils = api.useUtils();
  const [open, setOpen] = useState(false);
  const { currentStudio } = useStudio();

  const invite = useInviteStore<Invite>((state) => state);

  const updateInvite = invite.update;

  const { mutate, isPending: isLoading } = api.invites.create.useMutation({
    onSuccess: async () => {
      toast.success("Invite created");

      onOpenChange(false);

      await utils.invites.invalidate();

      await utils.invites.getAll.refetch();
      await utils.invites.get.refetch();
    },

    onError: (error) => {
      toast.error(error.message);
    },
  });

  function onOpenChange(open: boolean) {
    setOpen(open);
    if (!open) {
      updateInvite({
        nickname: "",
        limitedUses: false,
        usesRemaining: undefined,
      });

      return;
    }
  }

  function createInvite() {
    if (invite.nickname.length > 30) {
      updateInvite({
        nicknameError: "Nickname can't be longer than 30 characters",
      });
      return;
    }

    if (invite.limitedUses && isNaN(invite.usesRemaining as number)) {
      updateInvite({
        usesRemainingError: "Please enter a valid number",
      });
      return;
    }

    if (
      invite.limitedUses &&
      invite.usesRemaining &&
      invite.usesRemaining > 25
    ) {
      updateInvite({
        usesRemainingError: "You can't have more than 25 uses",
      });
      return;
    }

    if (currentStudio) {
      mutate({
        studioId: currentStudio.id,
        nickname:
          invite.nickname.trim() === "" || !invite.nickname
            ? undefined
            : invite.nickname.trim(),
        uses: invite.usesRemaining,
      });
      return;
    }
  }

  useEffect(() => {
    updateInvite({
      nicknameError: undefined,
      usesRemainingError: undefined,
    });
  }, [invite.nickname, invite.usesRemaining, updateInvite]);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogTrigger asChild>
        <Button>Create invite</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create new invite</DialogTitle>

          <div className="mt-2">
            <p className={"mb-1 mt-2 text-xs text-neutral-600"}>Nickname</p>
            <TextInput
              value={invite.nickname}
              error={!!invite.nicknameError}
              errorMessage={invite.nicknameError}
              className="mt-2"
              placeholder="Team Invite"
              onValueChange={(value: string) =>
                updateInvite({
                  nickname: value,
                })
              }
            />
          </div>

          <div className="mt-4">
            <p
              className={"mb-1 text-xs text-neutral-600 dark:text-neutral-400"}
            >
              Limited Uses
            </p>
            <Switch
              defaultChecked={false}
              checked={invite.limitedUses}
              onChange={(checked) =>
                updateInvite({
                  limitedUses: checked,
                })
              }
            />
          </div>
          {invite.limitedUses && (
            <div className="mt-2">
              <p className={"mb-1 mt-2 text-xs text-neutral-600"}>
                Maximum Uses
              </p>
              <NumberInput
                defaultValue={invite.usesRemaining ?? undefined}
                error={!!invite.usesRemainingError}
                errorMessage={invite.usesRemainingError}
                placeholder="5"
                min="1"
                max="25"
                onValueChange={(value) =>
                  updateInvite({
                    usesRemaining: value,
                  })
                }
              />
            </div>
          )}

          <DialogFooter>
            <Button className="mt-4" onClick={createInvite} loading={isLoading}>
              Create invite
            </Button>
          </DialogFooter>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
