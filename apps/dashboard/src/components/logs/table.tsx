"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
} from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Button,
  DateRangePicker,
  Select,
  SelectItem,
  TextInput,
} from "@tremor/react";
import { sub, subDays } from "date-fns";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStudio } from "../hooks/studio";
import { useUsageLimits } from "../hooks/usage-limits";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function IssuesTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [realData, setRealData] = useState<TData[]>([]);
  const [search, setSearch] = useState<string>("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const { currentStudio, usageLimits } = useStudio();
  const table = useReactTable({
    data: realData,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
    pageCount: 1,
    onPaginationChange: () => {},
  });

  useEffect(() => {
    table.getColumn("timestamp")?.setFilterValue({
      from: subDays(new Date(), 7),
      to: new Date(),
    });
  }, [table]);

  useEffect(() => {
    setRealData(data);
  }, [data]);

  return (
    <div>
      <div className="block space-y-1 md:hidden">
        <div className="w-full space-y-0.5">
          <span className="text-xs text-neutral-600">Timestamp</span>
          <DateRangePicker
            className="w-full max-w-none"
            disabled={!currentStudio}
            maxDate={new Date()}
            enableSelect={false}
            enableClear={false}
            defaultValue={{
              from: subDays(new Date(), 7),
              to: new Date(),
            }}
            value={{
              from: new Date(
                (
                  table.getColumn("timestamp")?.getFilterValue() as
                    | { from: Date; to: Date }
                    | undefined
                )?.from ?? subDays(new Date(), 7),
              ),
              to: new Date(
                (
                  table.getColumn("timestamp")?.getFilterValue() as
                    | { from: Date; to: Date }
                    | undefined
                )?.to ?? new Date(),
              ),
            }}
            onValueChange={(value) => {
              table.getColumn("timestamp")?.setFilterValue({
                from: value.from!,
                to: value.to!,
              });
            }}
          />
        </div>
        <div className="w-full space-y-0.5">
          <span className="text-xs text-neutral-600">Message</span>
          <TextInput
            placeholder="Filter messages..."
            value={
              (table.getColumn("message")?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table.getColumn("message")?.setFilterValue(event.target.value)
            }
          />
        </div>
        <div className="w-full space-y-0.5">
          <span className="text-xs text-neutral-600">Level</span>
          <Select
            className="max-w-none"
            value={
              (table.getColumn("level")?.getFilterValue() as string) ?? "all"
            }
            onValueChange={(value) =>
              table
                .getColumn("level")
                ?.setFilterValue(value === "all" ? null : value)
            }
          >
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="warn">Warning</SelectItem>
            <SelectItem value="crash">Crash</SelectItem>
          </Select>
        </div>
        <div className="w-full space-y-0.5">
          <span className="text-xs text-neutral-600">Environment</span>
          <Select
            className="max-w-none"
            value={
              (table.getColumn("env")?.getFilterValue() as string) ?? "all"
            }
            onValueChange={(value) =>
              table
                .getColumn("env")
                ?.setFilterValue(value === "all" ? null : value)
            }
          >
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="server">Server</SelectItem>
            <SelectItem value="client">Client</SelectItem>
          </Select>
        </div>
      </div>
      <div className="mb-2.5 hidden items-end space-x-2.5 md:flex">
        <div className="w-full max-w-[14rem] space-y-0.5">
          <span className="text-xs text-neutral-600">Timestamp</span>
          <DateRangePicker
            disabled={!currentStudio}
            maxDate={new Date()}
            enableSelect={false}
            enableClear={false}
            defaultValue={{
              from: subDays(new Date(), 7),
              to: new Date(),
            }}
            value={{
              from: new Date(
                (
                  table.getColumn("timestamp")?.getFilterValue() as
                    | { from: Date; to: Date }
                    | undefined
                )?.from ?? subDays(new Date(), 7),
              ),
              to: new Date(
                (
                  table.getColumn("timestamp")?.getFilterValue() as
                    | { from: Date; to: Date }
                    | undefined
                )?.to ?? new Date(),
              ),
            }}
            onValueChange={(value) => {
              table.getColumn("timestamp")?.setFilterValue({
                from: value.from!,
                to: value.to!,
              });
            }}
          />
        </div>
        <div className="w-full max-w-[26rem] space-y-0.5">
          <span className="text-xs text-neutral-600">Message</span>
          <div className="flex justify-start space-x-2">
            <TextInput
              placeholder="Filter messages..."
              value={
                (table.getColumn("message")?.getFilterValue() as string) ?? ""
              }
              onChange={(event) => {
                table.getColumn("message")?.setFilterValue(event.target.value);
                setSearch(event.target.value);
              }}
              className="max-w-sm"
            />
            <Button
              onClick={() => {
                table.setColumnFilters([]);

                // TODO: call a search function normally

                setRealData([
                  {
                    id: "1",
                    message: "test full search",
                    level: "crash",
                    env: "server",
                    occurences: 999,
                    timestamp: new Date().getTime(),
                  } as TData,
                ]);
              }}
            >
              Search
            </Button>
          </div>
        </div>

        <div className="space-y-0.5">
          <span className="text-xs text-neutral-600">Level</span>
          <Select
            className="max-w-[12rem]"
            value={
              (table.getColumn("level")?.getFilterValue() as string) ?? "all"
            }
            onValueChange={(value) =>
              table
                .getColumn("level")
                ?.setFilterValue(value === "all" ? null : value)
            }
          >
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="warn">Warning</SelectItem>
            <SelectItem value="crash">Crash</SelectItem>
          </Select>
        </div>
        <div className=" space-y-0.5 text-neutral-600">
          <span className="text-xs">Environment</span>
          <Select
            className="max-w-[12rem]"
            value={
              (table.getColumn("env")?.getFilterValue() as string) ?? "all"
            }
            onValueChange={(value) =>
              table
                .getColumn("env")
                ?.setFilterValue(value === "all" ? null : value)
            }
          >
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="server">Server</SelectItem>
            <SelectItem value="client">Client</SelectItem>
          </Select>
        </div>
      </div>
      <div className="overflow-clip rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : (flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          ) as ReactNode)}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {
                        flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        ) as ReactNode
                      }
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center font-medium text-neutral-600"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          color="gray"
          variant="secondary"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          color="gray"
          variant="secondary"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
