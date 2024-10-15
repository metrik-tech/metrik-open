import type { ReactNode } from "react";
import { useRouter } from "next/router";
import { Tab, TabGroup, TabList } from "@tremor/react";

import { ActionTabs } from "@/components/actions/tabs";
import { AppLayout } from "@/components/app-layout";
import { Layout } from "@/components/base-layout";
import { PageWrapper } from "@/components/page-wrapper";

export default function ActionsHistoryTab() {
  return (
    <Layout title="Run History">
      <ActionTabs currentTab="history" />
      <div className="my-6">
        <h1 className="text-2xl font-semibold">History</h1>
      </div>
    </Layout>
  );
}

ActionsHistoryTab.PageWrapper = PageWrapper;
ActionsHistoryTab.getLayout = function getLayout(page: ReactNode) {
  return (
    <AppLayout
      tab="actions"
      title="Actions History"
      project
      subTab={{
        name: "Run History",
        href: "history",
      }}
    >
      {page}
    </AppLayout>
  );
};
