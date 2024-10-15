"use client";

import { useRef, useState } from "react";
import {
  ClipboardIcon,
  EyeIcon,
  EyeSlashIcon,
  TrashIcon,
} from "@heroicons/react/16/solid";
import { Button, TableCell, TableRow } from "@tremor/react";
import clsx from "clsx";
import { format } from "date-fns";
import { CopyIcon, LinkIcon } from "lucide-react";
import { useClickAway, useCopyToClipboard, usePageLeave } from "react-use";
import { toast } from "sonner";

import type { Invite } from "@metrik/db/client";

import { api } from "@/utils/api";

function getUrl() {
  if (document.URL) {
    return new URL(document.URL).origin;
  } else {
    return `http://localhost:${process.env.PORT ?? 3000}`;
  }
}

export function InviteItem({ invite }: { invite: Invite }) {
  const [showCode, setShowCode] = useState(false);
  const [_, copyToClipboard] = useCopyToClipboard();
  const utils = api.useUtils();

  function deleteInvite() {
    toast.promise(
      deleteInviteAsync({ id: invite.id, studioId: invite.studioId }),
      {
        loading: "Deleting invite...",
        success: "Invite deleted!",
        error: "Failed to delete invite.",
      },
    );
  }

  const { mutateAsync: deleteInviteAsync, isPending } =
    api.invites.delete.useMutation({
      onSuccess: async () => {
        await utils.invites.getAll.refetch();
        await utils.invites.get.refetch();
      },
    });

  usePageLeave(() => setShowCode(false));
  return (
    <TableRow className="text-neutral-600 dark:text-neutral-400">
      <TableCell className="pl-0">{invite.nickname}</TableCell>
      <TableCell
        className={clsx(
          "flex select-none items-center font-mono",
          //   showCode ? "blur-none" : "blur-sm"
        )}
      >
        {showCode ? (
          invite.code
        ) : (
          <span>&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;</span>
        )}

        <button
          onClick={() => {
            copyToClipboard(invite.code);
            toast("Copied invite code to clipboard");
          }}
        >
          <ClipboardIcon className="ml-2 h-4 w-4 -translate-y-[0.05rem] text-neutral-700 dark:text-neutral-400" />
        </button>
        <button
          onClick={() => {
            setShowCode(!showCode);
          }}
        >
          {showCode ? (
            <EyeSlashIcon className="ml-2 h-4 w-4 -translate-y-[0.05rem] text-neutral-700 dark:text-neutral-400" />
          ) : (
            <EyeIcon className="ml-2 h-4 w-4 -translate-y-[0.05rem] text-neutral-700 dark:text-neutral-400" />
          )}
        </button>
        <button
          onClick={() => {
            copyToClipboard(`${getUrl()}/join/${invite.code}`);
            toast("Copied invite link to clipboard");
          }}
        >
          <LinkIcon className="ml-2 h-4 w-4 -translate-y-[0.05rem] text-neutral-700 dark:text-neutral-400" />
        </button>
      </TableCell>
      <TableCell>
        {invite.limitedUses ? invite.usesRemaining : "Unlimited"}
      </TableCell>
      <TableCell>{format(invite.createdAt, "MMM d y, h:mm a")}</TableCell>
      <TableCell>
        <Button
          variant="light"
          color="red"
          onClick={deleteInvite}
          iconPosition="right"
          icon={TrashIcon}
        >
          Delete
        </Button>
      </TableCell>
    </TableRow>
  );
}
