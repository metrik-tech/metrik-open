"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/router";
import { ChevronLeftIcon } from "@heroicons/react/20/solid";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@tremor/react";
import clsx from "clsx";
import { useMedia } from "react-use";
import { toast } from "sonner";

import type { Event, NotificationChannel, Project } from "@metrik/db/client";

import { AppLayout } from "@/components/app-layout";
import { PageWrapper } from "@/components/page-wrapper";
import { GeneralTab } from "@/components/project-settings/general";
import { NotificationsTab } from "@/components/project-settings/notifications";
import { TokensTab } from "@/components/project-settings/tokens";
import { useProject } from "@/hooks/project";
import { api } from "@/utils/api";

const tabs = [
  {
    name: "General",
    id: "general",
  },
  {
    name: "Webhooks & Events",
    id: "notifications",
  },
  {
    name: "Tokens",
    id: "tokens",
  },
];

export default function SettingsTab() {
  const [selectedTab, setTab] = useState<string | null>("general");

  const isSm = useMedia("(min-width: 640px)", true);
  const { project } = useProject();
  const router = useRouter();

  const initialTab = router.query.tab;

  const firstTab = tabs.find((tab) => tab.id === initialTab) ?? tabs[0];

  const { data: experience } = api.projects.getExperience.useQuery(
    { id: router.query.id as string },
    {
      enabled: !!router.query.id,
    },
  );

  const { data: channels } = api.channels.getAll.useQuery(
    {
      projectId: router.query.id as string,
    },
    {
      enabled: !!router.query.id,
    },
  );

  useEffect(() => {
    if (isSm === true) {
      setTab("general");
    } else {
      setTab(null);
    }
  }, [isSm]);

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
          <GeneralTab project={project as Project} experience={experience} />
        ) : selectedTab === "notifications" ? (
          <NotificationsTab channels={channels ? channels : []} />
        ) : selectedTab === "tokens" ? (
          <TokensTab />
        ) : null}
      </div>
    </div>
  );
}

SettingsTab.PageWrapper = PageWrapper;
SettingsTab.getLayout = (page: ReactNode) => (
  <AppLayout project tab="settings">
    {page}
  </AppLayout>
);
