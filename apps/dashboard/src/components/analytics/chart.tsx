import { useState } from "react";
import dynamic from "next/dynamic";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import Tippy from "@tippyjs/react";
import {
  Card,
  Flex,
  Icon,
  Tab,
  TabGroup,
  TabList,
  Text,
  Title,
  type Color,
} from "@tremor/react";
import { format, parseISO } from "date-fns";

import { cn } from "@/utils/cn";
import { LoadingSpinner } from "../loading-spinner";

const AreaChart = dynamic(
  () => import("@tremor/react").then((mod) => mod.AreaChart),
  {
    loading: () => {
      return (
        <div className="mt-8 flex h-96 items-center justify-center">
          <LoadingSpinner />
        </div>
      );
    },
    ssr: false,
  },
);

const numberFormatter = (value: number) =>
  `${Intl.NumberFormat("us").format(value).toString()}`;

const minuteFormatter = (value: number) => {
  return `${value.toFixed(2)} minutes`;
};

interface Analytics {
  timestamp: Date;
  playerCount: number;
  visits: number;
  newVisits: number;
  estimatedAverageSessionLength: number;
  favourites: number;
  likes: number;
  dislikes: number;
  serverCount: number;
  averageServerFps: number;
  averageServerPing: number;
  averageServerPlayers: number;
}

const kpis = [
  "Players",
  "New Visits",
  "Server Count",
  "Estimated Average Session Length",
];

// const customTooltip = ({
//   payload,
//   active,
//   label,
// }: {
//   payload: {
//     name: string;
//     dataKey: string;
//     value: number;
//     color: Color;
//   }[];
//   active: boolean;
//   label: string;
// }) => {
//   if (!active || !payload) return null;

//   return (
//     <div className="rounded-tremor-default text-tremor-default bg-tremor-background shadow-tremor-dropdown border-tremor-border dark:bg-dark-tremor-background dark:shadow-dark-tremor-dropdown dark:border-dark-tremor-border rounded">
//       <div className="border-tremor-border dark:border-dark-tremor-border border-b px-4 py-2">
//         <p className="text-tremor-content-emphasis dark:text-dark-tremor-content-emphasis font-medium">
//           {label} {payload[0]?.dataKey}
//         </p>
//       </div>
//       <div className="space-y-1 px-4 py-2">
//         {payload.map((data, index) => (
//           <div
//             className="flex items-center justify-between space-x-8"
//             key={index}
//           >
//             <div className="flex items-center space-x-2">
//               <span
//                 className={cn(
//                   "rounded-tremor-full border-tremor-background shadow-tremor-card dark:border-dark-tremor-background dark:shadow-dark-tremor-card h-3 w-3 shrink-0 border-2",
//                   getColorClassNames(data.color).bgColor,
//                 )}
//               />
//               <p className="text-tremor-content dark:text-dark-tremor-content whitespace-nowrap text-right">
//                 {data.name}
//               </p>
//             </div>
//             <p className="text-tremor-content-emphasis dark:text-dark-tremor-content-emphasis whitespace-nowrap text-right font-medium tabular-nums">
//               {data.value}
//             </p>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

export default function ChartView({ analytics }: { analytics: Analytics[] }) {
  const [selectedKpi, setSelectedKpi] = useState("Players");

  const formattedData = analytics.map((data) => ({
    date: format(data.timestamp, `h:mm a MM/dd`),
    Players: data.playerCount,
    "New Visits": data.newVisits,
    "Server Count": data.serverCount,
    "Estimated Average Session Length": data.estimatedAverageSessionLength,
  }));

  // map formatters by selectedKpi
  const formatters = {
    Players: numberFormatter,
    "New Visits": numberFormatter,
    "Server Count": numberFormatter,
    "Estimated Average Session Length": minuteFormatter,
  };

  return (
    <Card className="mt-6">
      <div className="justify-between md:flex">
        <div>
          <Flex
            justifyContent="start"
            className="space-x-0.5"
            alignItems="center"
          >
            <Title> Performance History </Title>
            <Tippy content="Shows hourly changes of performance">
              <Icon
                icon={InformationCircleIcon}
                className="cursor-pointer"
                variant="simple"
              />
            </Tippy>
          </Flex>
          <Text> Daily increase or decrease per type </Text>
        </div>
        <div className="mt-6 md:mt-0">
          <TabGroup
            defaultIndex={0}
            onIndexChange={(index) => setSelectedKpi(kpis[index]!)}
            index={kpis.indexOf(selectedKpi)}
          >
            <TabList variant="solid">
              <Tab>Players</Tab>
              <Tab>New Visits</Tab>
              <Tab>Server Count</Tab>
              <Tab>Estimated Average Session Length</Tab>
            </TabList>
          </TabGroup>
        </div>
      </div>
      <AreaChart
        data={formattedData}
        showAnimation={true}
        index="date"
        categories={[selectedKpi]}
        colors={["blue"]}
        showLegend={false}
        valueFormatter={formatters[selectedKpi as keyof typeof formatters]}
        yAxisWidth={14}
        className="mt-8 h-96"
      />
    </Card>
  );
}
