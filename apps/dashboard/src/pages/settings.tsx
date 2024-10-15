"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/router";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@tremor/react";
import clsx from "clsx";
import { useMedia } from "react-use";

import { AppLayout } from "@/components/app-layout";
import { PageWrapper } from "@/components/page-wrapper";
import { AuditLogTab } from "@/components/studio-settings/audit-log";
import { BillingPage } from "@/components/studio-settings/billing";
import { GeneralTab } from "@/components/studio-settings/general";
import { MembersTab } from "@/components/studio-settings/members";
import { useMembership } from "@/hooks/membership";
import { useStudio } from "@/hooks/studio";
import { api } from "@/utils/api";

const tabs = [
  {
    name: "General",
    id: "general",
    role: "USER",
  },
  {
    name: "Members",
    id: "members",
    role: "ADMIN",
  },
  {
    name: "Audit Log",
    id: "audit-log",
    role: "ADMIN",
  },
  {
    name: "Usage & Billing",
    id: "billing",
    role: "OWNER",
  },
];

export default function SettingsTab() {
  const router = useRouter();
  const [selectedTab, setTab] = useState<string | null>("general");

  const initialTab = router.query.tab;

  useEffect(() => {
    if (initialTab) {
      setTab(initialTab as string);
    }
  }, [initialTab]);

  return (
    <div>
      <TabGroup
        defaultIndex={
          initialTab ? tabs.findIndex((tab) => tab.id === initialTab) : 0
        }
        index={tabs.findIndex((tab) => tab.id === selectedTab)}
        onIndexChange={(index) => setTab(tabs[index ?? 0]?.id ?? "general")}
      >
        <TabList>
          {tabs.map((tab) => (
            <Tab key={tab.id}>{tab.name}</Tab>
          ))}
        </TabList>
      </TabGroup>
      <div className="mt-4">
        {selectedTab === "general" ? (
          <GeneralTab />
        ) : selectedTab === "members" ? (
          <MembersTab />
        ) : selectedTab === "audit-log" ? (
          <AuditLogTab />
        ) : selectedTab === "billing" ? (
          <BillingPage />
        ) : null}
      </div>
    </div>
  );
}

SettingsTab.PageWrapper = PageWrapper;

SettingsTab.getLayout = (page: ReactNode) => {
  return <AppLayout tab={"studiosettings"}>{page}</AppLayout>;
};
