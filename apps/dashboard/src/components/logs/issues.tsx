"use client";

import * as React from "react";
import { ServerIcon, UserIcon } from "@heroicons/react/24/outline";
import type { ColumnDef, Row } from "@tanstack/react-table";
import { Card, Divider } from "@tremor/react";
import { format } from "date-fns";
import { ArrowUpDownIcon, MoreHorizontalIcon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/utils/cn";
import { Checkbox } from "../ui/checkbox";
import { IssuesTable } from "./table";

type Log = {
  id: string;
  project_id: string;
  timestamp: number;
  level: "error" | "crash" | "warn";
  message: string;
  env: "server" | "client";
  job_id: string;
  universe_id: string;
  place_id: string;
  data?: string;
  occurences?: number;
};

const tempColumn: Log[] = [
  {
    id: "1",
    project_id: "1",
    timestamp: 1687197199000,
    level: "crash",
    message: "This is a test error",
    env: "server",
    job_id: "1",
    universe_id: "1",
    place_id: "1",
    data: JSON.stringify({
      foo: "bar",
      bar: "baz",
    }),
  },
  {
    id: "2",
    project_id: "1",
    timestamp: 1620065005000,
    level: "crash",
    message:
      "This is another test error but very very very long hahahahahahahaha",
    env: "client",
    job_id: "1",
    universe_id: "1",
    place_id: "1",
    occurences: 2,
  },
  {
    id: "3",
    project_id: "1",
    timestamp: 1620065005000,
    level: "error",
    message: "DJ KHALED (another one)",
    env: "client",
    job_id: "1",
    universe_id: "1",
    place_id: "1",
  },
];

const GhostButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(function GhostButton({ className, children, ...props }, ref) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex h-8 items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium ring-offset-white transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
GhostButton.displayName = "GhostButton";

const columns: ColumnDef<Log>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center">
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "level",
    header: ({ column }) => {
      return (
        <span className="flex items-center">
          Level
          <GhostButton
            className="ml-2 h-8 w-8 p-0"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <ArrowUpDownIcon className="h-4 w-4" />
          </GhostButton>{" "}
        </span>
      );
    },
    cell: ({ row }) => {
      const level = row.getValue("level");

      return (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-xs font-medium ${
            level === "error"
              ? "bg-red-100 text-red-800"
              : level === "warn"
                ? "bg-orange-100 text-orange-800"
                : "bg-purple-100 text-purple-800"
          }`}
        >
          {level as string}
        </span>
      );
    },
  },
  {
    accessorKey: "message",
    header: "Message",

    cell: ({ row }) => {
      const message = row.getValue<string>("message");

      return (
        <div className="truncate md:max-w-xs  lg:max-w-sm">
          <span className="truncate font-mono">{message}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "env",
    header: ({ column }) => {
      return (
        <span className="flex items-center">
          Environment
          <GhostButton
            className="ml-2 h-8 w-8 p-0"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <ArrowUpDownIcon className="h-4 w-4" />
          </GhostButton>{" "}
        </span>
      );
    },
    cell: ({ row }) => {
      const env = row.getValue("env");

      return env === "server" ? (
        <span className="flex items-center space-x-1">
          <ServerIcon className="h-4 w-4" />
          <span>Server</span>
        </span>
      ) : (
        <span className="flex items-center space-x-1">
          <UserIcon className="h-4 w-4" />
          <span>Client</span>
        </span>
      );
    },
  },
  {
    accessorKey: "occurences",
    header: "Occurences",
    cell: ({ row }) => {
      const occurences = row.getValue<number | undefined>("occurences");

      return <span>{occurences ?? 1}</span>;
    },
  },
  {
    accessorKey: "timestamp",
    header: "Timestamp",
    cell: ({ row }) => {
      const formatted = format(row.getValue("timestamp"), "MMM d y, h:mm:ss");

      return <span>{formatted}</span>;
    },

    filterFn: (row, id, filterValue) => {
      const { from, to } = filterValue as { from: Date; to: Date };

      const rowValue = row.getValue<number>(id);

      return new Date(rowValue) >= from && new Date(rowValue) <= to;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const payment = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <GhostButton className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontalIcon className="h-4 w-4" />
            </GhostButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => void navigator.clipboard.writeText(payment.id)}
            >
              Copy payment ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View customer</DropdownMenuItem>
            <DropdownMenuItem>View payment details</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export function IssuesTab() {
  return (
    <div>
      <IssuesTable columns={columns} data={tempColumn} />
    </div>
  );
}
