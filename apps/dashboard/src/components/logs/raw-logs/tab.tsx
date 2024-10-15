"use client";

import { useCallback, useRef, useState } from "react";
import {
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  FingerPrintIcon,
  InformationCircleIcon,
} from "@heroicons/react/20/solid";
import { Flex, Select, SelectItem } from "@tremor/react";
import subMinutes from "date-fns/subMinutes";
import { ServerCrashIcon } from "lucide-react";

import { LogItem } from "./log-item";
import { Search } from "./search";
import { TimeFrame } from "./time-frame";

interface Log {
  id: string;
  content: string;
  type: string;
  date: Date;
}

const times = {
  thirtyMinutes: 30,
  sixtyMinutes: 60,
  threeHours: 60 * 3,
  sixHours: 60 * 6,
  twelveHours: 60 * 12,
  twentyFourHours: 60 * 24,
  twoDays: 60 * 24 * 2,
  sevenDays: 60 * 24 * 7,
  thirtyDays: 60 * 24 * 30,
};

interface RawLogsTabProps {
  logs: Log[] | undefined;
}

export function RawLogsTab({ logs }: RawLogsTabProps) {
  const [timeFrame, setTimeFrame] = useState<string>("twelveHours");
  const [selectedType, setSelectedType] = useState<string>("all");

  const typeLogsExist = useCallback(
    (logs: Log[]) =>
      logs.some((log) =>
        selectedType !== "all" ? log.type === selectedType : true,
      ),
    [selectedType],
  );

  const timeFrameLogsExist = useCallback(
    (logs: Log[]) =>
      logs
        .filter((log) =>
          selectedType !== "all" ? log.type === selectedType : true,
        )
        .some(
          (log) =>
            subMinutes(
              new Date(),
              times[timeFrame as keyof typeof times],
            ).getTime() <= new Date(log.date).getTime(),
        ),
    [timeFrame, selectedType],
  );

  const dummy = useRef<null | HTMLDivElement>(null);

  const filterLogs = (logs: Log[] | undefined) =>
    logs?.length && typeLogsExist(logs) && timeFrameLogsExist(logs) ? (
      logs
        .filter(
          (log) =>
            subMinutes(
              new Date(),
              times[timeFrame as keyof typeof times],
            ).getTime() <= new Date(log.date).getTime(),
        )
        .filter((log) =>
          selectedType !== "all" ? log.type === selectedType : true,
        )
        .sort(
          (a: Log, b: Log) =>
            new Date(b.date).valueOf() - new Date(a.date).valueOf(),
        )
        .reverse()
        .map((log) => (
          <LogItem
            key={log.id}
            type={log.type}
            timestamp={log.date}
            message={log.content}
            setSelectedType={setSelectedType}
          />
        ))
    ) : (
      <div className="mt-6 flex h-full w-full items-center justify-center">
        <div className="text-center">
          <img
            src="https://illustrations.popsy.co/blue/abstract-art-6.svg"
            className="h-64 p-2"
            alt="404 illustration"
          />
          <p className="mb-0.5 text-sm font-medium text-neutral-800">
            No logs yet...
          </p>
          <p className="text-xs text-neutral-700">
            Learn how to install the SDK{" "}
            <a
              href="https://docs.metrik.app/docs/install"
              className="text-blue-600 transition-all"
              target="_blank"
              rel="noreferrer"
            >
              here
            </a>
          </p>
        </div>
      </div>
    );

  return (
    <div className="relative mx-auto w-full rounded-lg border border-neutral-200 bg-white p-6 text-left leading-5">
      <div className="hidden sm:mt-4 sm:flex sm:justify-start sm:space-x-2">
        {/* <MultiSelectBox
          onValueChange={(value) => setSelectedPlaces(value)}
          placeholder="Select Places"
          maxWidth="max-w-xs"
        >
          {mockPlaces.map((item) => (
            <MultiSelectBoxItem
              key={item.name}
              value={item.name}
              text={item.name}
            />
          ))}
        </MultiSelectBox> */}
        <TimeFrame
          state={timeFrame}
          setState={setTimeFrame}
          isEnterprise={true}
        />
        <Select
          className="max-w-xs"
          defaultValue={selectedType}
          onValueChange={(value) => setSelectedType(value)}
        >
          <SelectItem value="all" icon={FingerPrintIcon}>
            All
          </SelectItem>
          <SelectItem value="info" icon={InformationCircleIcon}>
            Info
          </SelectItem>
          <SelectItem value="warning" icon={ExclamationTriangleIcon}>
            Warning
          </SelectItem>
          <SelectItem value="error" icon={ExclamationCircleIcon}>
            Error
          </SelectItem>
          <SelectItem value="crash" icon={ServerCrashIcon}>
            Crash
          </SelectItem>
        </Select>
        <Search />
      </div>
      <div className="mt-6 space-y-2 sm:hidden sm:space-y-0">
        <TimeFrame
          mobile
          state={timeFrame}
          setState={setTimeFrame}
          isEnterprise={true}
        />
        <Select
          className="max-w-full"
          defaultValue={selectedType}
          onValueChange={(value) => setSelectedType(value)}
        >
          <SelectItem value="all" icon={FingerPrintIcon}>
            All
          </SelectItem>
          <SelectItem value="info" icon={InformationCircleIcon}>
            Info
          </SelectItem>
          <SelectItem value="warning" icon={ExclamationTriangleIcon}>
            Warning
          </SelectItem>
          <SelectItem value="error" icon={ExclamationCircleIcon}>
            Error
          </SelectItem>
          <SelectItem value="crash" icon={ServerCrashIcon}>
            Crash
          </SelectItem>
        </Select>
        <Search />
      </div>
      <div className="mt-4 max-h-[23rem] min-h-[23rem] overflow-scroll overscroll-contain rounded-md border border-neutral-200 bg-neutral-100">
        {filterLogs(logs)}

        <div ref={dummy}></div>
      </div>
      <Flex justifyContent="end">
        <button
          className="py-2 text-xs font-semibold uppercase tracking-wide text-neutral-700"
          onClick={() => {
            dummy.current?.scrollIntoView({ behavior: "smooth", block: "end" });
          }}
        >
          JUMP TO NEWEST
        </button>
      </Flex>
    </div>
  );
}
