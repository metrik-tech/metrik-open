import { type ReactNode } from "react";

import { AppLayout } from "@/components/app-layout";
import { IssuesTab } from "@/components/logs";
import { PageWrapper } from "@/components/page-wrapper";

export default function LogsTab() {
  return (
    <div className="mt-6">
      <IssuesTab />
    </div>
  );
}

LogsTab.getLayout = (page: ReactNode) => {
  return (
    <AppLayout project tab="logs">
      {page}
    </AppLayout>
  );
};

LogsTab.PageWrapper = PageWrapper;
