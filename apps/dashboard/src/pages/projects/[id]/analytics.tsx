"use client";

import { useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { StarIcon } from "@heroicons/react/20/solid";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import {
  AreaChart,
  BadgeDelta,
  Card,
  DateRangePicker,
  DateRangePickerItem,
  Flex,
  Grid,
  Icon,
  Metric,
  ProgressBar,
  Text,
  TextInput,
  Title,
  type DateRangePickerValue,
} from "@tremor/react";
import {
  addDays,
  format,
  startOfDay,
  sub,
  subDays,
  subHours,
  subMinutes,
  subWeeks,
} from "date-fns";
import { AlertCircleIcon, ClockIcon } from "lucide-react";
import { toast } from "sonner";

import { parse } from "@metrik/meridiem";

import Chart from "@/components/analytics/chart";
import { AppLayout } from "@/components/app-layout";
import { Layout } from "@/components/base-layout";
import { LoadingSpinner } from "@/components/loading-spinner";
import { PageWrapper } from "@/components/page-wrapper";
import { useProject } from "@/hooks/project";
import { useStudio } from "@/hooks/studio";
import { api } from "@/utils/api";

function numberWithCommas(x: string | number) {
  return parseInt(x.toString()).toLocaleString("en-US");
}

function formatDelta(delta: number | string | null) {
  if (delta === null) {
    return "Not enough data";
  }
  delta = parseFloat(delta.toString()) * 100;

  if (delta <= 10) {
    return delta.toFixed(2).replace("-", "") + "%";
  }

  return delta.toFixed(1).replace("-", "") + "%";
}

function getDeltaType(delta: number) {
  delta = parseFloat(delta.toString()) * 100;
  if (delta > 0) {
    return "moderateIncrease";
  } else if (delta < 0) {
    return "moderateDecrease";
  } else {
    return "unchanged";
  }
}

export default function AnalyticsTab() {
  function onValueChange(value: DateRangePickerValue) {
    setTimeFrame(value);
    void refetch();
  }

  const [timeFrame, setTimeFrame] = useState<DateRangePickerValue>({
    from: subDays(new Date(), 1),
    to: new Date(),
    selectValue: "tdy",
  });

  const { project: data } = useProject();
  const { currentStudio } = useStudio();
  const router = useRouter();

  const [timeRange, setTimeRange] = useState("");

  const {
    data: analytics,
    error,
    refetch,
    isPending: isLoading,
  } = api.aurora.analytics.useQuery(
    {
      projectId: router.query.id as string,
      from: timeFrame.from,
      to: timeFrame.to,
    },
    {
      enabled:
        !!router.query.id && !!data && data.createdAt < subDays(new Date(), 7),
    },
  );

  console.log({
    analytics,
    isLoading,
    error,
  });

  if (data && data.createdAt > subDays(new Date(), 7)) {
    return (
      <Layout title="Analytics">
        <div className="flex h-[80vh] flex-col items-center justify-center space-y-4">
          <ClockIcon className="h-10 w-10 text-neutral-500 dark:text-neutral-200" />
          <div>
            <p className="text-center font-medium text-tremor-content dark:text-dark-tremor-content">
              Your project is too new to have complete analytics data.
            </p>
            <p className="text-center font-medium text-tremor-content dark:text-dark-tremor-content">
              Please check back on{" "}
              <span className="text-tremor-content-emphasis dark:text-dark-tremor-content-emphasis">
                {format(addDays(data.createdAt, 7), "EEEE, LLLL do")}
              </span>
              .
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Analytics">
      <div className="mb-6 flex items-center justify-start space-x-2">
        <DateRangePicker
          className="max-w-none sm:max-w-sm"
          onValueChange={onValueChange}
          value={timeFrame}
          defaultValue={{
            from: subDays(new Date(), 1),
            to: new Date(),
            selectValue: "tdy",
          }}
          minDate={subDays(new Date(), 90)}
          maxDate={new Date()}
          key={JSON.stringify(timeFrame)}
        >
          <DateRangePickerItem
            key="6hr"
            value="6hr"
            from={subHours(new Date(), 6)}
            to={new Date()}
          >
            Past 6 hours
          </DateRangePickerItem>
          <DateRangePickerItem
            key="12hr"
            value="12hr"
            from={subHours(new Date(), 12)}
            to={new Date()}
          >
            Past 12 hours
          </DateRangePickerItem>
          <DateRangePickerItem
            key="24hr"
            value="24hr"
            from={subDays(new Date(), 1)}
            to={new Date()}
          >
            Past 24 hours
          </DateRangePickerItem>
          <DateRangePickerItem
            key="tdy"
            value="tdy"
            from={startOfDay(new Date())}
            to={new Date()}
          >
            Today
          </DateRangePickerItem>
          <DateRangePickerItem
            key="2days"
            value="2days"
            from={subDays(new Date(), 2)}
            to={new Date()}
          >
            Last 2 days
          </DateRangePickerItem>
          <DateRangePickerItem
            key="3days"
            value="3days"
            from={subDays(new Date(), 3)}
            to={new Date()}
          >
            Last 3 days
          </DateRangePickerItem>
          <DateRangePickerItem
            key="7days"
            value="7days"
            from={subWeeks(new Date(), 1)}
            to={new Date()}
          >
            Last 7 days
          </DateRangePickerItem>
          <DateRangePickerItem
            key="14days"
            value="14days"
            from={subWeeks(new Date(), 2)}
            to={new Date()}
          >
            Last 14 days
          </DateRangePickerItem>
          <DateRangePickerItem
            key="30days"
            value="30days"
            from={subWeeks(new Date(), 4)}
            to={new Date()}
          >
            Last month
          </DateRangePickerItem>
          <DateRangePickerItem
            key="60days"
            value="60days"
            from={subWeeks(new Date(), 8)}
            to={new Date()}
          >
            Last 2 months
          </DateRangePickerItem>
        </DateRangePicker>

        {/* <TextInput
          placeholder="Enter time range..."
          className="max-w-xs"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              const range = parse(event.currentTarget.value, new Date());

              if (range === null) {
                toast.error("Invalid time range");
                return;
              }

              const { start: from, end: to } = range;

              onValueChange({
                from,
                to,
                selectValue: "custom",
              });

              event.currentTarget.blur();
              event.currentTarget.value = "";
            }
          }}
        /> */}
      </div>

      <div>
        {!isLoading && analytics && !error ? (
          <div className="mt-6">
            <Grid
              numItemsMd={1}
              numItemsLg={2}
              className="gap-6 lg:gap-0 lg:shadow-sm"
            >
              <Card className="shadow-none lg:rounded-bl-none lg:rounded-br-none lg:rounded-tr-none">
                <Flex alignItems="start">
                  <div className="truncate">
                    <Text>Average Concurrent Players</Text>

                    <Metric className="truncate">
                      {numberWithCommas(analytics.concurrentPlayers.value)}
                    </Metric>
                  </div>

                  <div>
                    <BadgeDelta
                      deltaType={
                        analytics.concurrentPlayers.delta
                          ? getDeltaType(analytics.concurrentPlayers.delta)
                          : "unchanged"
                      }
                    >
                      {formatDelta(analytics.concurrentPlayers.delta)}
                    </BadgeDelta>
                  </div>
                </Flex>
              </Card>
              <Card className="shadow-none lg:rounded-bl-none lg:rounded-br-none lg:rounded-tl-none">
                <Flex alignItems="center">
                  <div className="truncate">
                    <Text>New Visits</Text>

                    <Metric className="truncate">
                      {numberWithCommas(analytics.newVisits.value)}
                    </Metric>
                  </div>
                  <div>
                    <BadgeDelta
                      deltaType={
                        analytics.newVisits.delta
                          ? getDeltaType(analytics.newVisits.delta)
                          : "unchanged"
                      }
                    >
                      {formatDelta(analytics.newVisits.delta)}
                    </BadgeDelta>
                  </div>
                </Flex>
              </Card>
              <Card className="shadow-none lg:rounded-br-none lg:rounded-tl-none lg:rounded-tr-none">
                <Flex alignItems="start">
                  <div className="truncate">
                    <Text>New Issues</Text>

                    <Metric className="truncate">
                      {numberWithCommas(analytics.serverCount.value)}
                    </Metric>
                  </div>
                  <div>
                    <BadgeDelta
                      deltaType={
                        analytics.serverCount.delta
                          ? getDeltaType(analytics.serverCount.delta)
                          : "unchanged"
                      }
                    >
                      {formatDelta(analytics.serverCount.delta)}
                    </BadgeDelta>
                  </div>
                </Flex>
              </Card>
              <Card className="shadow-none lg:rounded-bl-none lg:rounded-tl-none lg:rounded-tr-none">
                <Flex alignItems="start">
                  <div className="truncate">
                    <Text>Estimated Average Session Length</Text>

                    <Metric className="truncate tabular-nums">
                      {(
                        analytics.estimatedAverageSessionLength.value ?? 0
                      ).toFixed(2)}{" "}
                      minutes
                    </Metric>
                  </div>
                  <div>
                    <BadgeDelta
                      deltaType={
                        analytics.estimatedAverageSessionLength.delta
                          ? getDeltaType(
                              analytics.estimatedAverageSessionLength.delta,
                            )
                          : "unchanged"
                      }
                    >
                      {formatDelta(
                        analytics.estimatedAverageSessionLength.delta,
                      )}
                    </BadgeDelta>
                  </div>
                </Flex>
              </Card>
            </Grid>

            {/* <Grid numItemsMd={2} numItemsLg={2} className="mt-6 gap-6">
              <AreaChart 
                data={analytics.analytics.map((a) => ({
                  date: a.timestamp,
                  value: a.concurrentPlayers,
                }))}
                title="Concurrent Players"
                valueFormatter={(value) => value.toFixed(0)}
                valueSuffix=" players"
                color="var(--tremor-color-primary)"
              />
            </Grid> */}

            <Chart analytics={analytics.analytics} />
            <Grid numItemsMd={2} numItemsLg={3} className="gap-6">
              <Card className="mt-6">
                <Flex
                  justifyContent="start"
                  className="space-x-0.5"
                  alignItems="center"
                >
                  <Title>Top Regions</Title>{" "}
                  <Icon
                    icon={InformationCircleIcon}
                    variant="simple"
                    tooltip="Top regions by server count"
                  />
                </Flex>
              </Card>
              <Card className="mt-6">
                <Flex>
                  <Title>Like/Dislike Ratio</Title>
                </Flex>

                <Flex justifyContent="center" alignItems="center">
                  <div className="my-12 w-full sm:max-w-sm">
                    <p className="text-center text-3xl font-semibold text-neutral-700 dark:text-neutral-300 ">
                      {(analytics.likeDislikeRatio.value * 100 ?? 0).toFixed(1)}
                      %
                    </p>
                    <ProgressBar
                      value={analytics.likeDislikeRatio.value * 100}
                      showAnimation
                      className="mt-2"
                      color={
                        analytics.likeDislikeRatio.value > 0.7
                          ? "green"
                          : analytics.likeDislikeRatio.value > 0.5
                            ? "amber"
                            : "red"
                      }
                    />
                  </div>
                </Flex>
              </Card>
              <Card className="mt-6">
                <Flex>
                  <Title>Favourites</Title>
                </Flex>

                <Flex justifyContent="center" alignItems="center">
                  <div className="mt-6 w-full sm:max-w-sm">
                    <StarIcon className="mx-auto block h-10 w-10 text-amber-500" />
                    <p className="text-center text-5xl font-semibold text-neutral-700 dark:text-neutral-300">
                      {numberWithCommas(analytics.favourites.value)}
                    </p>
                  </div>
                </Flex>
              </Card>
            </Grid>
          </div>
        ) : !isLoading && error ? (
          <div className="flex h-[69vh] flex-col items-center justify-center space-y-4 rounded-md ">
            <AlertCircleIcon className="h-10 w-10 text-red-400 dark:text-red-600" />
            <div>
              <p className="font-medium text-tremor-content">{error.message}</p>
            </div>
          </div>
        ) : !isLoading && !analytics ? (
          <div className="d flex h-[69vh] flex-col items-center justify-center space-y-4 rounded-md">
            <AlertCircleIcon className="h-10 w-10 text-red-400 dark:text-red-600" />
            <div>
              <p className="font-medium text-tremor-content">No analytics</p>
            </div>
          </div>
        ) : (
          <div className="flex h-[69vh] items-center justify-center">
            <div role="status">
              <LoadingSpinner />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

AnalyticsTab.PageWrapper = PageWrapper;
AnalyticsTab.getLayout = (page: ReactNode) => (
  <AppLayout project tab="analytics">
    {page}
  </AppLayout>
);
