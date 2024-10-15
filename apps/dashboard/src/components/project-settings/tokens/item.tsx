"use client";

import { useEffect, useRef, useState } from "react";
import { TrashIcon } from "@heroicons/react/16/solid";
import { Button, TableCell, TableRow } from "@tremor/react";
import clsx from "clsx";
import { format } from "date-fns";
import { CopyIcon, LinkIcon } from "lucide-react";
import { useClickAway, useCopyToClipboard, usePageLeave } from "react-use";
import { toast } from "sonner";

import type { Invite, Token } from "@metrik/db/client";

import { api } from "@/utils/api";

export function TokenItem({ token }: { token: Omit<Token, "hashedToken"> }) {
  const utils = api.useUtils();

  async function deleteToken() {
    toast.promise(deleteTokenAsync({ id: token.id }), {
      loading: "Deleting token...",
      success: "Token deleted!",
      error: "Failed to delete token.",
    });

    await utils.tokens.getAll.invalidate();
  }

  const { mutateAsync: deleteTokenAsync } = api.tokens.delete.useMutation();
  const { mutate: getUser, data: user } =
    api.commands.getRobloxUser.useMutation();

  useEffect(() => {
    if (!token.userId) return;
    getUser({ userId: Number(token.userId) });
  }, [token.userId, getUser]);

  return (
    <TableRow className="text-neutral-600 dark:text-neutral-400">
      <TableCell className="pl-0">{token.nickname}</TableCell>
      <TableCell
        className={clsx(
          "flex select-none items-center font-mono",
          //   showCode ? "blur-none" : "blur-sm"
        )}
      >
        {token.prefix}...
      </TableCell>
      <TableCell className="w-64">
        <div className="flex items-center">
          {token.userId && user ? (
            <>
              <img
                src={user.avatarUrl}
                className="mr-2 h-5 w-5 rounded-full border bg-neutral-100 dark:bg-dark-tremor-background-muted"
              />
              <span>
                {user.displayName} (@{user.username})
              </span>
            </>
          ) : token.userId && !user ? (
            <>
              <div className="mr-2 h-5 w-5 animate-pulse rounded-full bg-neutral-200 dark:bg-dark-tremor-background-muted" />
              <span className="h-3 w-24 animate-pulse rounded-md bg-neutral-200"></span>
            </>
          ) : (
            <></>
          )}
        </div>
      </TableCell>
      <TableCell>
        {token.lastUsed ? format(token.lastUsed, "MMM d y, h:mm a") : "Never"}
      </TableCell>
      <TableCell>
        {token.expiry ? format(token.expiry, "MMM d y, h:mm a") : "Never"}
      </TableCell>
      <TableCell>{format(token.createdAt, "MMM d y, h:mm a")}</TableCell>
      <TableCell>
        <Button
          variant="light"
          color="red"
          onClick={deleteToken}
          iconPosition="right"
          icon={TrashIcon}
        >
          Delete
        </Button>
      </TableCell>
    </TableRow>
  );
}
