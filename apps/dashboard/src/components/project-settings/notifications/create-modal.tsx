"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/router";
import { Button, TextInput } from "@tremor/react";
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
import config, { ValidServices } from "@/utils/config";
import type { ValidEvents } from "@/utils/config";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";

interface NotificationChannel {
  nickname: string;
  nicknameError: string | undefined;
  hookUrl: string;
  hookUrlError: string | undefined;
  checkedState: boolean[];
  events: ValidEvents[];
  eventsError: string | undefined;
  update: (state: OptionalNotificationChannel) => void;
}

interface OptionalNotificationChannel {
  nickname?: string;
  nicknameError?: string | undefined;
  hookUrl?: string;
  hookUrlError?: string | undefined;
  checkedState?: boolean[];
  events?: ValidEvents[];
  eventsError?: string | undefined;
}

const useNotificationStore = create<NotificationChannel>((set) => ({
  nickname: "",
  nicknameError: undefined,
  hookUrl: "",
  hookUrlError: undefined,
  checkedState: new Array(Object.keys(config.validEvents).length).fill(
    false,
  ) as boolean[],
  events: [],
  eventsError: undefined,

  update: (state: OptionalNotificationChannel) =>
    set(
      (prev: NotificationChannel) =>
        ({ ...prev, ...state }) as NotificationChannel,
    ),
}));

interface NotificationModalProps {
  id?: ValidServices;
  children: ReactNode;
}

export function NotificationModal({
  id = ValidServices.Discord,
  children,
}: NotificationModalProps) {
  const router = useRouter();
  const utils = api.useUtils();
  const [open, setOpen] = useState(false);
  const projectId = router.query.id as string;

  const notification = useNotificationStore<NotificationChannel>(
    (state) => state,
  );

  const updateNotification = notification.update;

  interface Notification {
    nickname?: string;
    nicknameError?: string | undefined;
    hookUrl?: string;
    hookUrlError?: string | undefined;
    checkedState: boolean[];
    events?: string[];
    eventsError?: string | undefined;
  }

  const { mutate, isPending: isLoading } = api.channels.create.useMutation({
    onSuccess: async (data) => {
      toast.success(`Webhook ${data.nickname} created`);

      setOpen(false);
      await utils.channels.getAll.invalidate();
    },

    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { notificationServices } = config;

  const service = notificationServices.find((item) => item.id === id);

  function handleCheckboxes(position: number) {
    const updatedCheckedState: boolean[] = notification.checkedState.map(
      (item: boolean, index: number): boolean =>
        index === position ? !item : item,
    );

    updateNotification({
      checkedState: updatedCheckedState,
      events: updatedCheckedState
        .map((item: boolean, index: number): ValidEvents | null =>
          item
            ? (Object.values(config.validEvents)[index] as ValidEvents)
            : null,
        )
        .filter<ValidEvents>(
          (item: ValidEvents | null): item is ValidEvents => item !== null,
        ),
    });
  }

  function onOpenChange(open: boolean) {
    setOpen(open);
    if (!open) {
      updateNotification({
        nickname: undefined,
        hookUrl: undefined,
        checkedState: new Array(Object.keys(config.validEvents).length).fill(
          false,
        ),
      });

      return;
    }
  }

  function createChannel() {
    if (!notification.nickname || notification.nickname.length < 3) {
      updateNotification({
        nicknameError: "Nickname must be at least 3 characters",
      });
      return;
    }

    if (notification.nickname.length > 30) {
      updateNotification({
        nicknameError: "Nickname can't be longer than 30 characters",
      });
      return;
    }

    if (!notification.hookUrl || !service?.regex.test(notification.hookUrl)) {
      updateNotification({
        hookUrlError: "Invalid Webhook URL",
      });
      return;
    }

    if (!notification.events?.length) {
      updateNotification({
        eventsError: "You must select at least one event",
      });
      return;
    }

    mutate({
      projectId,
      nickname: notification.nickname,
      url: notification.hookUrl,
      events: notification.events,
      type: id,
    });
    return;
  }

  useEffect(() => {
    updateNotification({
      nicknameError: undefined,
      hookUrlError: undefined,
      eventsError: undefined,
    });
  }, [
    notification.nickname,
    notification.hookUrl,
    notification.events,
    updateNotification,
  ]);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogTrigger asChild>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="mr-2 aspect-square">
              <div className="rounded-md border p-4 shadow-sm transition-all ease-in-out hover:bg-neutral-50 dark:hover:bg-neutral-800">
                {children}
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent>{service?.name}</TooltipContent>
        </Tooltip>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add new {service?.name} webhook</DialogTitle>

          <div className="mt-2">
            <p
              className={"mb-1 text-xs text-neutral-600 dark:text-neutral-400"}
            >
              Nickname
            </p>
            <TextInput
              value={notification.nickname}
              error={!!notification.nicknameError}
              errorMessage={notification.nicknameError}
              placeholder="Captain Hook"
              onValueChange={(value: string) =>
                updateNotification({
                  nickname: value,
                })
              }
            />
          </div>

          <div className="mt-2">
            <p
              className={"mb-1 text-xs text-neutral-600 dark:text-neutral-400"}
            >
              Webhook URL
            </p>
            <TextInput
              value={notification.hookUrl}
              error={!!notification.hookUrlError}
              errorMessage={notification.hookUrlError}
              placeholder={service?.urlFormat}
              onValueChange={(value: string) =>
                updateNotification({
                  hookUrl: value,
                })
              }
            />
          </div>

          <div className="mt-2 text-left">
            <p className="text-xs text-neutral-600">Events</p>
            <ul className="flex flex-row gap-3">
              {Object.values(config.validEvents).map((item, index) => (
                <li className="mt-1 flex items-center" key={index}>
                  <input
                    type="checkbox"
                    id={`eventbox-${index}`}
                    className="h-4 w-4 cursor-pointer rounded-sm border-neutral-300 bg-neutral-100 text-blue-600 focus:outline-none focus:ring-0 focus:ring-offset-0 dark:border-neutral-700 dark:bg-neutral-800"
                    name={item}
                    value={item}
                    checked={notification.checkedState[index]}
                    onChange={() => handleCheckboxes(index)}
                  />
                  <label
                    htmlFor={`eventbox-${index}`}
                    className="ml-1.5 cursor-pointer font-mono text-sm text-neutral-800 dark:text-neutral-500"
                  >
                    {item}
                  </label>
                </li>
              ))}
            </ul>
            {notification.eventsError && (
              <p className="text-sm text-red-500">{notification.eventsError}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              className="mt-4"
              onClick={createChannel}
              loading={isLoading}
            >
              Create webhook
            </Button>
          </DialogFooter>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
