"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  ArrowRightStartOnRectangleIcon,
  Cog6ToothIcon,
  CreditCardIcon,
} from "@heroicons/react/16/solid";
import { CogIcon, LogOutIcon } from "lucide-react";
import type { Session } from "next-auth";
import { useSession } from "next-auth/react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/merlin/dropdown";
import { api } from "@/utils/api";

export function Dropdown() {
  const { data: session } = useSession();
  const router = useRouter();

  const { mutate } = api.billing.createPortalLink.useMutation({
    onSuccess: async (data) => {
      await router.push(data.url);
    },
  });

  return (
    <>

    <DropdownMenu>
      <DropdownMenuTrigger asChild className="">
        <button className="flex max-w-xs items-center rounded-full bg-neutral-300 text-sm  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-neutral-600 dark:focus:ring-offset-dark-tremor-background-muted">
          <div className="h-8 w-8 overflow-clip rounded-full bg-neutral-300 dark:bg-neutral-700">
            {session?.user.image && (
              <Image
                height="32"
                width="32"
                className="h-full w-full rounded-full"
                src={session.user.image}
                alt={session.user.name!}
              />
            )}
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="mt-1 w-20" align="end">
        <p className="flex items-center space-x-1.5 px-2 py-1 text-xs text-neutral-600 dark:text-neutral-500">
          Signed in as {session?.user.name}
        </p>
        <DropdownMenuItem asChild>
          <Link href="/user/settings" className="flex items-center space-x-1.5">
            <Cog6ToothIcon className="h-4 w-4 text-neutral-400" />{" "}
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <button
            onClick={() => mutate()}
            className="flex w-full items-center space-x-1.5"
          >
            <CreditCardIcon className="h-4 w-4 text-neutral-400" />{" "}
            <span>Billing Portal</span>
          </button>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/auth/signout" className="flex items-center space-x-1.5">
            <ArrowRightStartOnRectangleIcon className="h-4 w-4 text-neutral-400" />{" "}
            <span>Sign out</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    </>
  );
}
