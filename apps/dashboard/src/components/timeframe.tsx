import { Select, SelectItem } from "@tremor/react";
import type { Dispatch } from "react";

export function TimeFrame({
  state,
  setState,
}: {
  state: string;
  setState: Dispatch<string>;
}) {
  return (
    <Select
      defaultValue={state || "today"}
      onValueChange={(value) => setState(value)}
      className="max-w-xs"
    >
      <SelectItem value="today">Today</SelectItem>
      <SelectItem value="yesterday">Yesterday</SelectItem>
      <SelectItem value="last7">Last 7 days</SelectItem>
      <SelectItem value="last30">Last 30 days</SelectItem>
    </Select>
  );
}
