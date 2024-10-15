"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  EllipsisHorizontalIcon,
  TrashIcon,
  UserMinusIcon,
} from "@heroicons/react/20/solid";
import { TableCell, TableRow } from "@tremor/react";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import type { Membership, User } from "@metrik/db/client";

import { api } from "@/utils/api";
import { useMembership } from "../../hooks/membership";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../merlin/dropdown";
import { Skeleton } from "../../ui/skeleton";

export function MemberItem({
  member,
  user,
}: {
  member: Membership;
  user: User;
}) {
  const [role, setRole] = useState<string>(member.role);
  const { data: session } = useSession();
  const { isAdmin } = useMembership();
  const utils = api.useUtils();

  const { mutateAsync: removeMember } = api.membership.removeMember.useMutation(
    {
      onSuccess: async () => {
        await utils.studios.invalidate();
        await utils.users.invalidate();

        await utils.studios.getAll.refetch();
        await utils.studios.get.refetch();
        await utils.studios.getAuditLog.refetch();
        await utils.studios.getUsageLimits.refetch();
      },
    },
  );

  const { mutateAsync: leaveStudio } = api.membership.leave.useMutation({
    onSuccess: async () => {
      await utils.studios.invalidate();
      await utils.users.invalidate();

      await utils.studios.getAll.refetch();
      await utils.studios.get.refetch();
      await utils.studios.getAuditLog.refetch();
      await utils.studios.getUsageLimits.refetch();
    },
  });

  const { mutateAsync: updateMember } = api.membership.updateMember.useMutation(
    {
      onSuccess: async () => {
        await utils.studios.invalidate();
        await utils.users.invalidate();

        await utils.studios.getAll.refetch();
        await utils.studios.get.refetch();
        await utils.studios.getAuditLog.refetch();
        await utils.studios.getUsageLimits.refetch();
      },
    },
  );

  useEffect(() => {
    if (role !== member.role) {
      toast.promise(
        updateMember({
          userId: user.id,
          studioId: member.studioId,
          role: role as "ADMIN" | "USER",
        }),
        {
          loading: "Updating member...",
          success: "Successfully updated member.",
          error: "Could not update member.",
        },
      );
    }
  }, [role, member.role, member.studioId, user.id, updateMember]);

  return (
    <TableRow className="h-6 text-neutral-600 dark:text-neutral-400">
      <TableCell className="pl-0">
        <span className="inline-flex items-center">
          {user ? (
            <Image
              src={`https://thumbs.metrik.app/headshot/${
                user.robloxId ?? "1"
              }/48`}
              className="rounded-full bg-neutral-300 dark:bg-neutral-600"
              height="28"
              width="28"
              alt={`Profile picture for ${user.name ?? ""}`}
            />
          ) : (
            <Skeleton className="aspect-square h-[28px] w-[28px] rounded-full" />
          )}

          <span className="ml-2 font-medium text-neutral-800 dark:text-neutral-400">
            {user.name}
          </span>
        </span>
      </TableCell>
      <TableCell className="font-mono">{member.role}</TableCell>
      <TableCell>{format(member.createdAt, "MMM d y, h:mm a")}</TableCell>

      <TableCell>
        {user.id === session?.user.id && member.role !== "OWNER" ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="cursor-pointer">
              <EllipsisHorizontalIcon className="h-5 w-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-40" align="start">
              <DropdownMenuItem
                asChild
                onClick={() =>
                  toast.promise(
                    leaveStudio({
                      studioId: member.studioId,
                    }),
                    {
                      loading: "Leaving studio...",
                      success: "Successfully left studio.",

                      error: "Could not leave studio.",
                    },
                  )
                }
              >
                <button className="flex w-full items-center">
                  <UserMinusIcon className="mr-2 h-4 w-4" />
                  <span>Leave</span>
                </button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : user.id !== session?.user.id &&
          member.role !== "OWNER" &&
          isAdmin ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="cursor-pointer">
              <EllipsisHorizontalIcon className="h-5 w-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-40" align="start">
              <DropdownMenuRadioGroup value={role} onValueChange={setRole}>
                <DropdownMenuRadioItem value="ADMIN">
                  Admin
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="USER">User</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                asChild
                onClick={() =>
                  toast.promise(
                    removeMember({
                      userId: user.id,
                      studioId: member.studioId,
                    }),
                    {
                      loading: "Removing member...",
                      success: "Successfully removed member.",
                      error: "Could not remove member.",
                    },
                  )
                }
              >
                <button className="flex w-full items-center">
                  <UserMinusIcon className="mr-2 h-4 w-4" />
                  <span>Remove</span>
                </button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : !isAdmin && member.role !== "OWNER" ? (
          <EllipsisHorizontalIcon className="h-5 w-5" />
        ) : (
          <p>Owner</p>
        )}
      </TableCell>
    </TableRow>
  );
}
