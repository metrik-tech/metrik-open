import { useEffect } from "react";
import { TableCell, TableRow } from "@tremor/react";
import { format } from "date-fns";

import { Broadcast } from "@metrik/db/client";

import { api } from "@/utils/api";
import { Button } from "../merlin/button";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";

export const BroadcastRow = ({
  broadcast,
}: {
  broadcast: Broadcast & {
    user?: {
      username: string;
    };
  };
}) => {
  return (
    <TableRow
      key={broadcast.id}
      className="*:px-0 *:text-neutral-600 *:dark:text-neutral-300"
    >
      <TableCell>
        <div className="flex items-center space-x-2">
          <img
            src={`https://thumbs.metrik.app/headshot/${broadcast.userId}`}
            className="h-6 w-6 rounded-full border bg-neutral-100 dark:bg-neutral-600"
          />

          <span className=" text-sm font-medium ">
            @{broadcast.user?.username}
          </span>
        </div>
      </TableCell>
      <TableCell className="group relative">
        <p className="w-[36rem] truncate font-mono text-sm">
          {broadcast.message}
        </p>
        <div className="absolute inset-0 flex h-full w-full items-center justify-end">
          <Dialog>
            <DialogTrigger
              asChild
              className="trainsition-opacity -translate-x-4 opacity-0 duration-150 ease-in-out group-hover:opacity-100"
            >
              <Button variant="outline" size="sm">
                View message
              </Button>
            </DialogTrigger>
            <DialogContent>
              <p className="mt-4 font-mono text-sm">{broadcast.message}</p>
            </DialogContent>
          </Dialog>
        </div>
      </TableCell>
      <TableCell>
        <p className="w-[5rem] truncate font-mono text-sm">{broadcast.type}</p>
      </TableCell>
      <TableCell>
        <p className="text-sm">
          {format(broadcast.timestamp, "MMMM d, h:mm a")}
        </p>
      </TableCell>
    </TableRow>
  );
};
