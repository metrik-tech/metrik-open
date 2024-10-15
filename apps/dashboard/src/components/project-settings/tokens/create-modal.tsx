"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/router";
import Tooltip from "@tippyjs/react";
import {
  Button,
  DatePicker,
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { api } from "@/utils/api";
import config from "@/utils/config";
import type { ValidEvents, ValidServices } from "@/utils/config";
import { useStudio } from "../../hooks/studio";

interface Token {
  nickname: string;
  expiry: Date | undefined;

  nicknameError: string | undefined;
  update: (state: OptionalToken) => void;
}

interface OptionalToken {
  nickname?: string;
  expiry?: Date | undefined;

  nicknameError?: string | undefined;
}

const useTokenStore = create<Token>((set) => ({
  nickname: "",
  expiry: undefined,
  nicknameError: undefined,

  update: (state: OptionalToken) =>
    set((prev: Token) => ({ ...prev, ...state }) as Token),
}));

export function NewTokenModal({ isLoading }: { isLoading: boolean }) {
  const router = useRouter();
  const utils = api.useUtils();
  const [open, setOpen] = useState(false);
  const { currentStudio } = useStudio();

  const [rawToken, setRawToken] = useState<string | undefined>(undefined);

  const token = useTokenStore<Token>((state) => state);

  const updateToken = token.update;

  const { mutate, isPending: isMutating } = api.tokens.create.useMutation({
    onSuccess: async (data) => {
      toast.success("Token created");

      setRawToken(data.rawToken);

      await utils.tokens.invalidate();
    },

    onError: (error) => {
      toast.error(error.message);
    },
  });

  function onOpenChange(open: boolean) {
    setOpen(open);
    if (!open) {
      updateToken({
        nickname: "",
        expiry: undefined,
      });

      setRawToken(undefined);

      return;
    }
  }

  function createInvite() {
    if (!token.nickname.trim()) {
      updateToken({
        nicknameError: "Nickname is required",
      });
      return;
    }

    if (token.nickname.length > 30) {
      updateToken({
        nicknameError: "Nickname can't be longer than 30 characters",
      });
      return;
    }

    if (currentStudio) {
      mutate({
        studioId: currentStudio.id,
        nickname: token.nickname.trim(),
        projectId: router.query.id as string,
        expiry: token.expiry,
      });
      return;
    }
  }

  useEffect(() => {
    updateToken({
      nicknameError: undefined,
    });
  }, [token.nickname, updateToken]);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogTrigger asChild>
        <Button disabled={isLoading}>Create Token</Button>
      </DialogTrigger>

      <DialogContent>
        {!rawToken ? (
          <>
            <DialogHeader>
              <DialogTitle>Create new token</DialogTitle>
            </DialogHeader>

            <div className="mt-2">
              <p className={"mb-1 mt-2 text-xs text-neutral-600"}>Nickname</p>
              <TextInput
                value={token.nickname}
                error={!!token.nicknameError}
                errorMessage={token.nicknameError}
                className="mt-2"
                placeholder="Token for SDK"
                onValueChange={(value: string) =>
                  updateToken({
                    nickname: value,
                  })
                }
              />
            </div>

            <div className="mt-4">
              <p
                className={
                  "mb-1 text-xs text-neutral-600 dark:text-neutral-400"
                }
              >
                Expiry <span className="text-neutral-500">(optional)</span>
              </p>
              <DatePicker
                className="mt-2"
                value={token.expiry}
                minDate={new Date()}
                onValueChange={(value) =>
                  updateToken({
                    expiry: value,
                  })
                }
                enableYearNavigation={true}
                defaultValue={undefined}
              />
            </div>

            <DialogFooter>
              <Button
                className="mt-4"
                onClick={createInvite}
                loading={isMutating}
              >
                Create Token
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Your new token</DialogTitle>
              <DialogDescription>
                You will only be able to see this token once. Please save it
                somewhere safe, such as a password manager, so you can access it
                later.
              </DialogDescription>
            </DialogHeader>

            <div>
              <p className={"mb-1 mt-2 text-xs text-neutral-600"}>Token</p>
              <TextInput
                value={rawToken}
                className="mt-2 font-mono"
                readOnly
                onClick={() => {
                  void navigator.clipboard.writeText(rawToken);
                  toast("Copied token to clipboard");
                }}
              />
            </div>

            <DialogFooter>
              <Button className="mt-4" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
