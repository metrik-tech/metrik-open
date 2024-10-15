import { type ReactNode } from "react";
import { skipToken } from "@tanstack/react-query";

import { AppLayout } from "@/components/app-layout";
import Code from "@/components/code";
import { PageWrapper } from "@/components/page-wrapper";
import { useProject } from "@/hooks/project";
import { api } from "@/utils/api";

export default function ServersTab() {
  const { project } = useProject();

  const { data: servers, isLoading } = api.servers.getAllServers.useQuery(
    {
      projectId: project?.id as string,
    },
    {
      enabled: !!project?.id,
    },
  );

  return (
    <div className="mt-6">
      <p>This page is a WIP but will show Active Servers</p>
      <Code language={"json"}>
        {!isLoading ? JSON.stringify(servers, null, 2) : "Loading..."}
      </Code>
    </div>
  );
}

ServersTab.getLayout = (page: ReactNode) => {
  return (
    <AppLayout project tab="servers">
      {page}
    </AppLayout>
  );
};

ServersTab.PageWrapper = PageWrapper;
