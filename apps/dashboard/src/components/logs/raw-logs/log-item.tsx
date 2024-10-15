import { useCallback, useEffect, type Dispatch } from "react";
import { useRouter } from "next/router";
import { ClipboardIcon, LinkIcon } from "@heroicons/react/20/solid";
import { Flex, Icon } from "@tremor/react";
import clsx from "clsx";
import format from "date-fns/format";

import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";

interface LogItemProps {
  timestamp: Date;
  type: string;
  message: string;
  setSelectedType: Dispatch<string>;
}

export function LogItem({
  timestamp,
  type,
  message,
  setSelectedType,
}: LogItemProps) {
  const router = useRouter();

  const handleTypeSelect = useCallback(() => {
    setSelectedType(type);
  }, [setSelectedType, type]);

  const handleMessageCopy = useCallback(() => {
    void copyTextToClipboard(message);
  }, [message]);

  const handleLinkCopy = useCallback(() => {
    console.log("link copied");
  }, []);

  async function copyTextToClipboard(text: string) {
    if ("clipboard" in navigator) {
      return await navigator.clipboard.writeText(text);
    } else {
      return document.execCommand("copy", true, text);
    }
  }

  return (
    <div className="group relative px-4 py-2 font-mono text-xs hover:bg-neutral-200">
      <Flex>
        <div>
          <Tooltip>
            <TooltipTrigger>
              <span className="mr-2">
                {format(new Date(timestamp), "dd/LL/y kk:mm:ss")}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {format(new Date(timestamp), "eeee LLLL L ppp")}
            </TooltipContent>
          </Tooltip>

          <span
            className={clsx([
              "mr-1.5 inline rounded p-0.5 font-semibold",
              type === "error"
                ? "text-red-700"
                : type === "warning"
                  ? "text-amber-600"
                  : "text-sky-600",
            ])}
          >
            [{type.toUpperCase() || "INFO"}]
          </span>
          <span>{message}</span>
        </div>
        <div className="absolute right-8 mr-2 translate-y-[0.12rem]">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleMessageCopy}
                className="hidden items-center group-hover:inline-flex"
              >
                <ClipboardIcon className="mr-1.5 h-6 w-6 rounded-md bg-white p-[0.2rem] shadow" />{" "}
              </button>
            </TooltipTrigger>
            <TooltipContent>Copy log message to clipboard</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleLinkCopy}
                className="hidden items-center group-hover:inline-flex"
              >
                <LinkIcon className="mr-1.5 h-6 w-6 rounded-md bg-white p-[0.2rem] shadow" />{" "}
              </button>
            </TooltipTrigger>
            <TooltipContent>Copy link to log item to clipboard</TooltipContent>
          </Tooltip>
        </div>
      </Flex>
    </div>
  );
}
