import { type ReactNode } from "react";

import { AppLayout } from "@/components/app-layout";
import { PageWrapper } from "@/components/page-wrapper";

export default function LogsTab() {
  return <div className="mt-6">flags</div>;
}

LogsTab.getLayout = (page: ReactNode) => {
  return (
    <AppLayout project tab="flags">
      {page}
    </AppLayout>
  );
};

LogsTab.PageWrapper = PageWrapper;
