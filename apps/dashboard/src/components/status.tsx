import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import config from "@/utils/config";

export interface Page {
  name: string;
  url: string;
  status: string;
}
export interface RootStatus {
  page: Page;
}

export default function Status() {
  const { data } = useQuery({
    networkMode: "online",
    queryKey: ["status"],
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const status = await fetch(`${config.statusUrl}summary.json`);

      if (!status.ok) {
        return {
          page: {
            status: "ERROR",
          },
        };
      }

      return status.json() as Promise<RootStatus>;
    },
  });

  function getStatusText(status: string) {
    switch (status) {
      case "UP":
        return "All systems normal";
      case "HASISSUES":
        return "Experiencing Issues";
      case "UNDERMAINTENANCE":
        return "Under maintenance";
      case "LOADING":
        return "Loading...";
      case "ERROR":
        return "Error loading status";
    }
  }

  const colors = {
    UP: "#16a34a",
    HASISSUES: "#f97316",
    UNDERMAINTENACE: "#4b5563",
    LOADING: "#000000",
    ERROR: "#dc2626",
  };

  return (
    <Link href={config.statusUrl} className="flex items-center" target="_blank">
      <div
        className="relative mr-2 h-1 w-1 rounded-full"
        style={{
          backgroundColor:
            colors[
              (data ? data.page.status : "LOADING") as keyof typeof colors
            ],
        }}
      >
        <div
          className="absolute inset-0 h-1 w-1 animate-ping rounded-full"
          style={{
            backgroundColor:
              colors[
                (data ? data.page.status : "LOADING") as keyof typeof colors
              ],
          }}
        ></div>
      </div>
      <span className="text-sm text-neutral-600 dark:text-neutral-500">
        {getStatusText(data ? data.page.status : "LOADING")}
      </span>
    </Link>
  );
}
