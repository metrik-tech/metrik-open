"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { useAction, useOptimisticAction } from "next-safe-action/hooks";

import { isAuthorizedForAdmin } from "@/utils/authorization";
import { addBannedUser } from "@/utils/config";
import {
  ban,
  toggleEarlyAccessAction,
  togglePreviewEnvAccessAction,
  unbanAction,
} from "../action";

export function EarlyAccessToggle({
  userId,
  status,
  email,
}: {
  userId: string;
  status: boolean;
  email: string;
}) {
  const router = useRouter();
  const { execute } = useAction(toggleEarlyAccessAction, {
    onSettled: () => {
      router.refresh();
    },
  });

  if (!isAuthorizedForAdmin(email)) {
    return null;
  }

  return (
    <button
      onClick={() => {
        const formData = new FormData();

        formData.append("userId", userId);
        formData.append("email", email);

        window.confirm(
          "Are you sure you want to toggle Early Access for this user?",
        ) && execute(formData);
      }}
    >
      {status ? "On" : "Off"}
    </button>
  );
}

export function RobloxAccountBannedToggle({
  robloxId,
  userId,
  username,
  status,
  email,
}: {
  robloxId: string;
  userId: string;
  username: string;
  status:
    | {
        timestamp: number;
        robloxId: number;
        friendlyIdentifier: string;
        reason: string;
        appealable?: boolean;
        expiry?: number;
      }
    | undefined;
  email: string;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { execute: unban } = useAction(
    unbanAction,

    {
      onSettled: () => {
        router.refresh();
      },
    },
  );

  if (!isAuthorizedForAdmin(email)) {
    return null;
  }

  return (
    <div className="flex items-center justify-start gap-y-3">
      {!status ? (
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger>Ban</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/20" />
            <Dialog.Content className="fixed inset-0 z-50 mx-auto my-auto flex max-h-fit max-w-md flex-col items-start justify-start bg-white p-4 text-center">
              <Dialog.Title className="text-left text-lg font-medium">
                Ban user {userId}
              </Dialog.Title>
              <form
                action={ban}
                className="flex w-full flex-col [&>label]:mt-2 [&>label]:text-left"
              >
                <input type="hidden" name="userId" value={userId} />
                <input type="hidden" name="robloxId" value={robloxId} />
                <input type="hidden" name="email" value={email} />
                <label htmlFor="friendlyIdentifier">Friendly Identifier</label>
                <input
                  className="rounded-none border border-black p-1 text-sm focus:outline-none"
                  type="text"
                  name="friendlyIdentifier"
                  id="friendlyIdentifier"
                  defaultValue={username}
                />
                <label htmlFor="reason">Reason</label>
                <textarea
                  name="reason"
                  id="reason"
                  className="rounded-none border border-black p-1 text-sm focus:outline-none"
                />
                <div className="mt-2 flex items-center gap-x-2">
                  <label htmlFor="appealable">Appealable</label>
                  <input type="checkbox" name="appealable" id="appealable" />
                </div>
                <div className="mt-2 flex items-center gap-x-2">
                  <label htmlFor="expiry">Expiry</label>
                  <input type="date" name="expiry" />
                </div>

                <button
                  type="submit"
                  className="mt-3 w-full bg-black py-2 text-white"
                  onClick={() => setOpen(false)}
                >
                  Ban
                </button>
              </form>
              <Dialog.Close className="absolute right-4 top-4" />
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      ) : (
        <button
          onClick={() => {
            const formData = new FormData();

            formData.append("userId", robloxId);
            formData.append("email", email);

            window.confirm(
              "Are you sure you want to toggle Roblox Account Banned for this user?",
            ) && unban(formData);
          }}
        >
          Unban
        </button>
      )}
    </div>
  );
}

export function PreviewAccessToggle({
  userId,
  status,
  email,
}: {
  userId: string;
  status: boolean;
  email: string;
}) {
  const router = useRouter();
  const { execute } = useAction(
    togglePreviewEnvAccessAction,

    {
      onSettled: () => {
        router.refresh();
      },
    },
  );

  if (!isAuthorizedForAdmin(email)) {
    return null;
  }

  return (
    <button
      onClick={() => {
        const formData = new FormData();

        formData.append("userId", userId);
        formData.append("email", email);

        window.confirm(
          "Are you sure you want to toggle Preview Access for this user?",
        ) && execute(formData);
      }}
    >
      {status ? "On" : "Off"}
    </button>
  );
}
