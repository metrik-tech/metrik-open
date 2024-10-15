"use client";

import { useState } from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { EllipsisVerticalIcon } from "@heroicons/react/20/solid";
import Tooltip from "@tippyjs/react";
import { Card, Divider, Flex, Text, Title } from "@tremor/react";

import type { Event, NotificationChannel, Project } from "@metrik/db/client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/merlin/dropdown";
import config from "@/utils/config";
import type { ValidServices } from "@/utils/config";
import { NotificationModal } from "./create-modal";
import { DeleteNotificationModal } from "./delete-modal";

interface NotificationsTabProps {
  channels: (NotificationChannel & { events: Event[] })[];
}

export function NotificationsTab({ channels }: NotificationsTabProps) {
  const { notificationServices } = config;
  const [parent] = useAutoAnimate<HTMLDivElement>();

  return (
    <div>
      <Card>
        <h4 className="font-display text-xl font-semibold">
          Add a new Webhook
        </h4>
        <p className="mb-3 mt-2 text-sm text-neutral-800 dark:text-neutral-400">
          Webhooks send messages when certain events are triggered inside of
          Metrik. This is an early feature that will be heavily revamped in the
          future.
        </p>
        <div className="mt-4">
          {notificationServices?.map((service) => (
            <NotificationModal id={service.id} key={service.id}>
              {service.icon}
            </NotificationModal>
          ))}
        </div>
      </Card>
      {channels?.length > 0 && <Divider />}
      {channels?.length > 0 ? (
        <div className="mt-6">
          <h4 className="font-display text-xl font-semibold">
            Notification channels
          </h4>
          <div className="mt-4" ref={parent}>
            {channels?.map((channel) => (
              <Card className="mt-4" key={channel.id}>
                <Flex>
                  <div className="flex items-center">
                    <div className="mr-4">
                      {
                        notificationServices.find(
                          (service) => service.id === channel.type,
                        )?.icon
                      }
                    </div>
                    <div>
                      <h4 className="inline-block text-lg font-semibold">
                        {channel.nickname}
                      </h4>
                      <span className="ml-3 font-mono text-sm text-neutral-500">
                        {channel.events.map((event) => event.type).join(", ")}
                      </span>
                      {/* <p className="max-w-xs sm:max-w-sm truncate text-sm text-neutral-500">
                          {channel.webhookUrl}
                        </p> */}
                    </div>
                  </div>
                  <div>
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <EllipsisVerticalIcon className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-36">
                        <DropdownMenuItem>
                          <button>Edit</button>
                        </DropdownMenuItem>

                        <DeleteNotificationModal
                          channelName={channel.nickname}
                          channelId={channel.id}
                        >
                          <DropdownMenuItem
                            className="text-red-600"
                            onSelect={(event) => event.preventDefault()}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DeleteNotificationModal>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </Flex>
              </Card>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
