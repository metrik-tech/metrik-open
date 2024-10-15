import { useEffect } from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { UserPlusIcon } from "@heroicons/react/24/solid";
import {
  Button,
  Card,
  Divider,
  List,
  ListItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@tremor/react";

import type { Membership, Studio } from "@metrik/db/client";

import { useMembership } from "@/hooks/membership";
import { useStudio } from "@/hooks/studio";
import { api } from "@/utils/api";
import { LoadingSpinner } from "../../loading-spinner";
import { Footer } from "../../ui/footer";
import { NewInviteModal } from "./create-invite-modal";
import { InviteItem } from "./invite";
import { MemberItem } from "./member";

export function MembersTab() {
  const { currentStudio } = useStudio();
  const utils = api.useUtils();
  const [parent] = useAutoAnimate();
  const { isOwner } = useMembership();

  const { data: users, isPending: isUsersLoading } = api.users.getMany.useQuery(
    {
      ids: currentStudio?.membership.map((member) => member.userId) as string[],
    },
    {
      enabled: !!currentStudio,
    },
  );

  const { data: invites, isPending: isInvitesLoading } =
    api.invites.getAll.useQuery(
      { studioId: currentStudio?.id as string },
      {
        enabled: !!currentStudio && isOwner,
      },
    );

  return (
    <div className="space-y-4">
      {isOwner && (
        <Card className="">
          <h4 className="mb-4 font-display text-xl font-semibold">Invites</h4>
          <div className="mb-4 border-b" />
          {!isInvitesLoading && invites?.length ? (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell className="pl-0 text-neutral-800 dark:text-neutral-300">
                    Nickname
                  </TableHeaderCell>
                  <TableHeaderCell className=" text-neutral-800 dark:text-neutral-300">
                    Invite Code
                  </TableHeaderCell>

                  <TableHeaderCell className="text-neutral-800 dark:text-neutral-300">
                    Uses Remaining
                  </TableHeaderCell>
                  <TableHeaderCell className="text-neutral-800 dark:text-neutral-300">
                    Date Created
                  </TableHeaderCell>
                  <TableHeaderCell className="text-neutral-800 dark:text-neutral-300">
                    Actions
                  </TableHeaderCell>
                </TableRow>
              </TableHead>

              <TableBody ref={parent}>
                {!isInvitesLoading &&
                  invites?.map((invite) => (
                    <InviteItem invite={invite} key={invite.id} />
                  ))}
              </TableBody>
            </Table>
          ) : !isInvitesLoading ? (
            <div className="flex h-32 w-full items-center justify-center rounded-md border-2 border-dashed">
              <div>
                <UserPlusIcon
                  className="mx-auto h-7 w-7 text-neutral-400 dark:text-neutral-600"
                  strokeWidth="1.5px"
                />
                <p className="mt-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  No invites
                </p>
              </div>
            </div>
          ) : (
            <div className="flex h-32 w-full items-center justify-center">
              <div className="flex" role="status">
                <LoadingSpinner />
              </div>
            </div>
          )}

          <Footer>
            <div className="flex w-full items-center justify-end">
              <NewInviteModal />
            </div>
          </Footer>
        </Card>
      )}

      <Card>
        <h4 className="mb-4 font-display text-xl font-semibold">Members</h4>
        <div className="mb-4 border-b" />
        {!isUsersLoading && users?.length ? (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell className="pl-0 text-neutral-800 dark:text-neutral-300">
                  Name
                </TableHeaderCell>
                <TableHeaderCell className=" text-neutral-800 dark:text-neutral-300">
                  Role
                </TableHeaderCell>
                <TableHeaderCell className="text-neutral-800 dark:text-neutral-300">
                  Join Date
                </TableHeaderCell>

                <TableHeaderCell className="text-neutral-800 dark:text-neutral-300">
                  Actions
                </TableHeaderCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {!isUsersLoading &&
                users &&
                currentStudio &&
                users
                  .sort((a) => {
                    if (
                      currentStudio.membership.find(
                        (member) => member.userId === a.id,
                      )?.role === "OWNER"
                    ) {
                      return -1;
                    }

                    return 0;
                  })
                  .map((user) => (
                    <MemberItem
                      user={user}
                      member={
                        currentStudio.membership.find(
                          (member) => member.userId === user.id,
                        ) as Membership
                      }
                      key={user.id}
                    />
                  ))}
            </TableBody>
          </Table>
        ) : (
          <div className="mb-6 flex h-32 w-full items-center justify-center">
            <div className="flex" role="status">
              <LoadingSpinner />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
