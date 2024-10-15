"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { useRouter } from "next/router";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/16/solid";
import { MegaphoneIcon } from "@heroicons/react/20/solid";
import { DropdownMenuRadioGroup } from "@radix-ui/react-dropdown-menu";
import {
  Card,
  Flex,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Textarea,
  Title,
} from "@tremor/react";
import { format } from "date-fns";
import { toast } from "sonner";

import { BroadcastType } from "@metrik/db/client";

import { AppLayout } from "@/components/app-layout";
import { BroadcastRow } from "@/components/broadcasts/row";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Button } from "@/components/merlin/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/merlin/dropdown";
import { PageWrapper } from "@/components/page-wrapper";
import { Footer } from "@/components/ui/footer";
import { TextArea } from "@/components/ui/input";
import { api } from "@/utils/api";

const PaginationButton = ({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  children: ReactNode;
}) => {
  return (
    <button
      type="button"
      className="group px-2.5 py-2 text-tremor-default disabled:cursor-not-allowed disabled:opacity-50"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default function BroadcastsTab() {
  const [newBroadcastType, setNewBroadcastType] =
    useState<BroadcastType>("CHAT");
  const [broadcastMessage, setBroadcastMessage] = useState<string>("");
  const [page, setPage] = useState<number>(1);

  const router = useRouter();

  const {
    data: history,
    error,
    refetch,
    isPending: isLoading,
  } = api.broadcasts.getHistory.useQuery(
    {
      projectId: router.query.id as string,
      page: page,
    },
    {
      enabled: !!router.query.id,
    },
  );

  console.log(history);

  const { mutate, isPending: isSending } = api.broadcasts.send.useMutation({
    onSuccess: async () => {
      await refetch();
      toast.message(`Broadcast sent!`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  function sendBroadcast() {
    mutate({
      projectId: router.query.id as string,
      message: broadcastMessage,
      type: newBroadcastType,
      serverIds: [], // FOR ETHAN :-)
      placeVersions: [], // FOR ETHAN :-)
    });
  }

  return (
    <div>
      <Card>
        <Title>Send a broadcast </Title>
        <Textarea
          className="mt-3 !h-24 resize-none font-mono"
          placeholder="Type your broadcast message here. Roblox rich text is supported."
          maxLength={150}
          onChange={(e) => setBroadcastMessage(e.target.value)}
        />

        <Flex className="mt-4">
          <div></div>
          <div className="flex items-center">
            <Select
              onValueChange={(e) => setNewBroadcastType(e as BroadcastType)}
              value={newBroadcastType}
              className="z-20 !font-mono"
            >
              {Object.keys(BroadcastType).map((key) => (
                <SelectItem key={key} value={key}>
                  {key}
                </SelectItem>
              ))}
            </Select>

            <Button
              className="ml-2"
              onClick={sendBroadcast}
              loading={isSending}
            >
              Send
            </Button>
          </div>
        </Flex>
      </Card>
      <Card className="mt-6">
        <Title>Broadcast History</Title>

        <div className="h-[300px] overflow-y-auto lg:h-[556px]">
          {!isLoading && history && history.broadcasts.length > 0 ? (
            <>
              <Table>
                <TableHead>
                  <TableRow className="*:px-0">
                    <TableHeaderCell>Run by</TableHeaderCell>
                    <TableHeaderCell>Message</TableHeaderCell>
                    <TableHeaderCell>Type</TableHeaderCell>
                    <TableHeaderCell>Timestamp</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history?.broadcasts.map((item, index) => (
                    <BroadcastRow broadcast={item} key={item.id} />
                  ))}
                </TableBody>
              </Table>
              <div className="absolute bottom-0 z-10 flex items-center justify-between bg-white pt-2 dark:bg-dark-tremor-background">
                <p className="text-sm text-tremor-content dark:text-dark-tremor-content">
                  Page{" "}
                  <span className="font-medium text-tremor-content-emphasis dark:text-dark-tremor-content-emphasis">
                    {page}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-tremor-content-emphasis dark:text-dark-tremor-content-emphasis">
                    {history.totalPages}
                  </span>
                </p>
                <div className="inline-flex items-center rounded-tremor-full shadow-tremor-input ring-1 ring-inset ring-tremor-ring dark:shadow-dark-tremor-input dark:ring-dark-tremor-ring">
                  <PaginationButton
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeftIcon
                      className="h-5 w-5 text-tremor-content-emphasis group-hover:text-tremor-content-strong dark:text-dark-tremor-content-emphasis group-hover:dark:text-dark-tremor-content-strong"
                      aria-hidden={true}
                    />
                  </PaginationButton>
                  <span
                    className="h-5 border-r border-tremor-border dark:border-dark-tremor-border"
                    aria-hidden={true}
                  />
                  <PaginationButton
                    onClick={() => setPage(page + 1)}
                    disabled={page === history.totalPages}
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRightIcon
                      className="h-5 w-5 text-tremor-content-emphasis group-hover:text-tremor-content-strong dark:text-dark-tremor-content-emphasis group-hover:dark:text-dark-tremor-content-strong"
                      aria-hidden={true}
                    />
                  </PaginationButton>
                </div>
              </div>
            </>
          ) : !isLoading ? (
            <div className="flex h-96 flex-col items-center justify-center gap-y-4 rounded-md border-2 border-dashed">
              <MegaphoneIcon className="h-8 w-8 text-neutral-500" />
              <p className="font-medium">No broadcasts found</p>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <LoadingSpinner />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

BroadcastsTab.PageWrapper = PageWrapper;
BroadcastsTab.getLayout = (page: ReactNode) => (
  <AppLayout project tab="broadcasts">
    {page}
  </AppLayout>
);
