"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BackspaceIcon,
  PlusIcon,
  UserIcon,
  UserMinusIcon,
  UserPlusIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import Tooltip from "@tippyjs/react";
import { Card, Divider, Flex, TextInput } from "@tremor/react";
import clsx from "clsx";
import { format } from "date-fns";
import { toast } from "sonner";

import type { AuditItem, Studio, User } from "@metrik/db/client";

import { Button } from "@/components/merlin/button";
import { Footer } from "@/components/ui/footer";
import { useMembership } from "@/hooks/membership";
import { useStudio } from "@/hooks/studio";
import { api } from "@/utils/api";
import { LoadingSpinner } from "../../loading-spinner";
import { DeleteModal } from "../general/delete-modal";

const auditTypes = {
  JOIN_STUDIO: {
    icon: UserPlusIcon,
    text: (user: User, studio: Studio, subject: string | null) => (
      <>
        <span className="font-semibold">{user.name}</span> joined the studio
        <span className="font-semibold"> {studio.name}</span>
      </>
    ),
    color: "bg-green-500",
  },
  RENAME_STUDIO: {
    icon: BackspaceIcon,
    text: (user: User, studio: Studio, subject: string | null) => (
      <>
        <span className="font-semibold">{user.name}</span> renamed the studio
        <span className="font-semibold"> {subject}</span>
      </>
    ),
    color: "bg-blue-500",
  },
  LEAVE_STUDIO: {
    icon: UserMinusIcon,
    text: (user: User, studio: Studio, subject: string | null) => (
      <>
        <span className="font-semibold">{user.name}</span> left the studio
        <span className="font-semibold"> {studio.name}</span>
      </>
    ),
    color: "bg-neutral-500",
  },
  CREATE_PROJECT: {
    icon: PlusIcon,
    text: (user: User, studio: Studio, subject: string | null) => (
      <>
        <span className="font-semibold">{user.name}</span> created a new project
        <span className="font-semibold"> {subject}</span>
      </>
    ),
    color: "bg-green-500",
  },
  DELETE_PROJECT: {
    icon: XMarkIcon,
    text: (user: User, studio: Studio, subject: string | null) => (
      <>
        <span className="font-semibold">{user.name}</span> deleted the project
        <span className="font-semibold"> {subject}</span>
      </>
    ),
    color: "bg-red-500",
  },
  RENAME_PROJECT: {
    icon: BackspaceIcon,
    text: (user: User, studio: Studio, subject: string | null) => (
      <>
        <span className="font-semibold">{user.name}</span> renamed the project
        <span className="font-semibold"> {subject}</span>
      </>
    ),
    color: "bg-blue-500",
  },
  CREATE_INVITE: {
    icon: PlusIcon,
    text: (user: User, studio: Studio, subject: string | null) => (
      <>
        <span className="font-semibold">{user.name}</span> created invite
        <span className="font-semibold"> {subject}</span>
      </>
    ),
    color: "bg-green-500",
  },
  DELETE_INVITE: {
    icon: XMarkIcon,
    text: (user: User, studio: Studio, subject: string | null) => (
      <>
        <span className="font-semibold">{user.name}</span> deleted invite
        <span className="font-semibold"> {subject}</span>
      </>
    ),
    color: "bg-red-500",
  },
  CHANGE_MEMBER_ROLE: {
    icon: UserIcon,
    text: (user: User, studio: Studio, subject: string | null) => (
      <>
        <span className="font-semibold">{user.name}</span> changed the role of
        <span className="font-semibold"> {subject}</span>
      </>
    ),
    color: "bg-blue-500",
  },
  REMOVE_MEMBER: {
    icon: UserMinusIcon,
    text: (user: User, studio: Studio, subject: string | null) => (
      <>
        <span className="font-semibold">{user.name}</span> removed
        <span className="font-semibold"> {subject}</span>
      </>
    ),
    color: "bg-red-500",
  },
  CREATE_NOTIFICATION_CHANNEL: {
    icon: PlusIcon,
    text: (user: User, studio: Studio, subject: string | null) => (
      <>
        <span className="font-semibold">{user.name}</span> created a new
        notification channel
        <span className="font-semibold"> {subject}</span>
      </>
    ),
    color: "bg-green-500",
  },
  DELETE_NOTIFICATION_CHANNEL: {
    icon: XMarkIcon,
    text: (user: User, studio: Studio, subject: string | null) => (
      <>
        <span className="font-semibold">{user.name}</span> deleted the
        notification channel
        <span className="font-semibold"> {subject}</span>
      </>
    ),
    color: "bg-red-500",
  },
};

export function AuditLogTab({
  initialAuditLogs,
}: {
  initialAuditLogs?: AuditItem[];
}) {
  const { currentStudio } = useStudio();

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    api.studios.getAuditLog.useInfiniteQuery(
      {
        studioId: currentStudio?.id as string,
      },
      {
        enabled: !!currentStudio,
        getNextPageParam: (lastPage) => {
          return lastPage.nextCursor;
        },
      },
    );

  return (
    <Card>
      <h4 className="font-display text-xl font-semibold">Audit Log</h4>
      <Divider />
      {!isLoading && data ? (
        <div>
          <div className="mt-6 flow-root">
            <ul role="list" className="-mb-8">
              {data.pages
                .flat(1)
                .map((item) => item.logs)
                .map((page) => {
                  return page.map((item, index) => {
                    const { icon: Icon, text, color } = auditTypes[item.type];
                    return (
                      <li key={item.id}>
                        <div className="relative pb-8">
                          {index !== page.length - 1 ? (
                            <span
                              className="absolute left-4 top-5 -ml-px h-full w-0.5 bg-neutral-200 dark:bg-neutral-600"
                              aria-hidden="true"
                            />
                          ) : null}
                          <div className="relative flex items-center space-x-3">
                            <div>
                              <span
                                className={clsx(
                                  color,
                                  "flex h-8 w-8 items-center justify-center rounded-full ring-8 ring-white dark:ring-dark-tremor-background",
                                )}
                              >
                                <Icon
                                  className="h-5 w-5 text-white dark:text-dark-tremor-background"
                                  aria-hidden="true"
                                />
                              </span>
                            </div>
                            <Flex className="w-full">
                              <div>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                  {text(item.user, item.studio, item.subject)}
                                </p>
                              </div>
                              <div className=" space-x-2 text-sm">
                                <span className="font-medium text-neutral-600 dark:text-neutral-400">
                                  {format(item.createdAt, "MMM d y, h:mm a")}
                                </span>
                              </div>
                            </Flex>
                          </div>
                        </div>
                      </li>
                    );
                  });
                })}
            </ul>
          </div>
          <div className="mt-8 flex w-full items-center justify-center">
            <Button
              onClick={() => void fetchNextPage()}
              disabled={!hasNextPage}
              variant="ghost"
              size="sm"
              loading={isFetchingNextPage}
            >
              {hasNextPage ? "Load More" : "You've reached the end"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mb-6 flex h-64 w-full items-center justify-center">
          <div className="flex" role="status">
            <LoadingSpinner />
          </div>
        </div>
      )}
    </Card>
  );
}
