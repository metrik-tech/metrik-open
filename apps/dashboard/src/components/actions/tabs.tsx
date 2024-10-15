import { useRouter } from "next/router";
import { ClockIcon, HomeIcon } from "@heroicons/react/20/solid";
import { Tab, TabGroup, TabList } from "@tremor/react";

export function ActionTabs({ currentTab }: { currentTab: string }) {
  const router = useRouter();

  const tabs = [
    {
      slug: "run",
      name: "Home",
    },
    // {
    //   slug: "schedules",
    //   name: "Schedules",
    // },
    {
      slug: "history",
      name: "Run History",
    },

    // maybe settings later
  ];
  //

  const currentTabIndex = tabs.findIndex((tab) => tab.slug === currentTab);

  return (
    <TabGroup
      defaultIndex={currentTabIndex}
      index={currentTabIndex}
      onIndexChange={(index: number) => {
        void router.replace(
          `/projects/${router.query.id as string}/actions/${
            tabs[index]?.slug === "run" ? "" : tabs[index]?.slug ?? ""
          }`,
        );
      }}
      className="mt-2 pb-4"
    >
      <TabList>
        {tabs.map((tab) => (
          <Tab key={tab.slug}>{tab.name}</Tab>
        ))}
      </TabList>
    </TabGroup>
  );
}
