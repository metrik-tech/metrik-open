import { Select, SelectItem } from "@tremor/react";

interface TimeFrameProps {
  state: string;
  setState: (value: string) => void;
  isEnterprise?: boolean;
  mobile?: boolean;
}

export function TimeFrame({
  state,
  setState,
  isEnterprise = false,
  mobile = false,
}: TimeFrameProps) {
  return (
    <Select
      defaultValue={state}
      onValueChange={(value: string) => setState(value)}
      className={mobile ? "max-w-full" : "max-w-xs"}
    >
      <SelectItem value="thirtyMinutes">Last 30 minutes </SelectItem>
      <SelectItem value="sixtyMinutes">Last 60 minutes</SelectItem>
      <SelectItem value="threeHours">Last 3 hours</SelectItem>
      <SelectItem value="sixHours">Last 6 hours</SelectItem>
      <SelectItem value="twelveHours">Last 12 hours</SelectItem>
      <SelectItem value="twentyFourHours">Last 24 hours</SelectItem>
      <SelectItem value="twoDays">Last two days</SelectItem>
      <SelectItem value="sevenDays">Last 7 days</SelectItem>
      {isEnterprise ? (
        <SelectItem value="thirtyDays">Last 30 days</SelectItem>
      ) : (
        <></>
      )}
    </Select>
  );
}
