import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/16/solid";
import { UserCircleIcon } from "@heroicons/react/20/solid";
import { useDebounce } from "@uidotdev/usehooks";
import { CommandEmpty, CommandList, CommandLoading } from "cmdk";

import { LoadingSpinner } from "@/components/loading-spinner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { api } from "@/utils/api";
import { cn } from "@/utils/cn";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "./user-lookup-command";

interface User {
  userId: number;
  avatarUrl: string;
  username: string;
  displayName: string;
  idMatch: boolean;
}

export function PlayerSearch({
  value,
  onValueChange,
  defaultValue,
  required,
  disabled,
}: {
  value: string | undefined;
  onValueChange: (value: string) => void;
  defaultValue?: string | undefined;
  required: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [user, setUser] = useState<User | undefined>();
  const [cache, setCache] = useState<
    Record<string, User[] | null | undefined> | undefined
  >();
  const debouncedSearch = useDebounce(search, 100);

  const { mutate: searchUsers, isPending: isUsersLoading } =
    api.commands.userLookup.useMutation({
      onSuccess: (data) => {
        setCache((prev) => ({ ...prev, [data.search]: data.users ?? [] }));
      },
    });

  const { mutate: getUserById, isPending: isUserLoading } =
    api.commands.getRobloxUser.useMutation({
      onSuccess: (data) => {
        setUser(data);
      },
    });

  useEffect(() => {
    if (defaultValue) {
      getUserById({ userId: Number(defaultValue) });
    }
  }, [defaultValue, getUserById]);

  useEffect(() => {
    if (user && user.userId !== Number(value)) {
      onValueChange(String(user.userId));
    }
  }, [onValueChange, user, value]);

  useEffect(() => {
    if (debouncedSearch) {
      if (
        search.length > 3 &&
        search.length <= 20 &&
        !cache?.[debouncedSearch]
      ) {
        searchUsers({ search: debouncedSearch });
      }
    }
  }, [cache, debouncedSearch, search.length, searchUsers]);

  const shouldOpen = disabled ? false : open;

  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <Popover open={shouldOpen} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            ref={buttonRef}
            className={cn(
              "relative w-full truncate whitespace-nowrap rounded-tremor-default border border-tremor-border bg-tremor-background py-2 pl-3 text-left text-sm text-tremor-content-emphasis shadow-tremor-input outline-none transition duration-100  focus:border-tremor-brand-subtle focus:ring-2 focus:ring-tremor-brand-muted dark:border-dark-tremor-border dark:bg-dark-tremor-background dark:text-dark-tremor-content-emphasis dark:shadow-dark-tremor-input  dark:focus:border-dark-tremor-brand-subtle dark:focus:ring-dark-tremor-brand-muted",
              !disabled &&
                "hover:bg-tremor-background-muted dark:hover:bg-dark-tremor-background-muted",
            )}
          >
            <span className="flex w-[90%] items-center space-x-1.5 truncate">
              {user ? (
                <img
                  src={user?.avatarUrl}
                  className="h-5 w-5 rounded-full border bg-neutral-100 dark:bg-dark-tremor-background-muted"
                />
              ) : (
                <UserCircleIcon className="h-5 w-5 text-tremor-content-subtle dark:text-dark-tremor-content-subtle" />
              )}

              <span className="font-medium">
                {!user && !disabled
                  ? "Select a player"
                  : !user && disabled
                    ? "No player selected"
                    : user?.displayName}
              </span>
              {user && (
                <span className="text-neutral-600 dark:text-neutral-400">
                  (@{user.username})
                </span>
              )}
            </span>
            <span className="absolute inset-y-0 right-0 mr-3 flex items-center space-x-1">
              {user && (
                <Link
                  href={`https://www.roblox.com/users/${user?.userId}/profile`}
                  target="_blank"
                  tabIndex={-1}
                  onClick={() => setOpen(false)}
                >
                  <ArrowTopRightOnSquareIcon className="size-[18px] text-tremor-content-subtle dark:text-dark-tremor-content-subtle" />
                </Link>
              )}

              {!disabled && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5 flex-none text-tremor-content-subtle dark:text-dark-tremor-content-subtle"
                >
                  <path d="M11.9999 13.1714L16.9497 8.22168L18.3639 9.63589L11.9999 15.9999L5.63599 9.63589L7.0502 8.22168L11.9999 13.1714Z"></path>
                </svg>
              )}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-64 p-0 lg:w-96"
          align="start"
          style={{
            width: buttonRef.current?.offsetWidth,
          }}
          side="top"
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search for a player..."
              className="h-9"
              value={search}
              onValueChange={setSearch}
            />
            <CommandList className="[--cmdk-list-height:11rem]">
              {(search.length <= 3 || !cache?.[search]?.length) &&
                !isUsersLoading && (
                  <div className="flex h-[11.7rem] items-center justify-center text-sm">
                    <span>No results found</span>
                  </div>
                )}

              {isUsersLoading && !cache?.[search] && (
                <CommandLoading className="flex h-[11.7rem] items-center justify-center">
                  <LoadingSpinner />
                </CommandLoading>
              )}

              {cache?.[search]?.length !== 0 && search.length > 3 && (
                <CommandGroup>
                  {cache?.[search]?.map((cacheUser) => (
                    <CommandItem
                      key={cacheUser.userId}
                      value={String(cacheUser.userId)}
                      className="grid grid-cols-4"
                      onSelect={(currentValue) => {
                        setUser(
                          currentValue === String(user?.userId) && !required
                            ? undefined
                            : cacheUser,
                        );
                        setOpen(false);
                        setSearch("");
                      }}
                    >
                      <div
                        className={cn(
                          "flex items-center space-x-2",
                          cacheUser.idMatch ? "col-span-3" : "col-span-4",
                        )}
                      >
                        <img
                          src={cacheUser.avatarUrl}
                          className="h-5 w-5 rounded-full border bg-neutral-100 dark:bg-dark-tremor-background-muted"
                        />
                        <span>{cacheUser.displayName}</span>
                        <span className="truncate text-sm text-neutral-600 dark:text-neutral-400">
                          (@{cacheUser.username})
                        </span>
                      </div>
                      {cacheUser.idMatch && (
                        <p className="text-right text-xs font-semibold uppercase text-neutral-600 dark:text-neutral-400">
                          ID Match
                        </p>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  );
}
