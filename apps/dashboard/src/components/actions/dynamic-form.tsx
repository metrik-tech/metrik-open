import { type Dispatch } from "react";
import { NumberInput, Select, SelectItem, TextInput } from "@tremor/react";

import { type ActionArgumentType } from "@metrik/db/client";

import { cn } from "@/utils/cn";
import { PlayerSearch } from "./player-search";

export interface Value {
  name: string;
  type: ActionArgumentType;
  value: string;
}

export function DynamicForm({
  args,
  values,
  setValues,
  readOnly,
}: {
  args: {
    id: string;
    name: string;
    type: ActionArgumentType;
    required: boolean;
    default: string | null;
    value?: string;
  }[];
  values: Value[];
  setValues: Dispatch<Value[]>;
  readOnly?: boolean;
}) {
  function setValue(name: string, value: string | undefined) {
    const array = Array.from(values);
    const index = values.findIndex((arg) => arg.name === name);
    const arg = args.find((arg) => arg.name === name);

    if (!arg) {
      return;
    }

    if (index === -1) {
      if (value === undefined) {
        return;
      }
      array.push({
        name,
        type: arg.type,
        value,
      });
    } else {
      if (value === undefined) {
        array.splice(index, 1);
      } else {
        array[index] = {
          name,
          type: arg.type,
          value,
        };
      }
    }

    setValues(array);
  }
  return (
    <div className={cn("grid", readOnly ? "gap-2" : "gap-4")}>
      {args.map((arg) => (
        <div className="flex flex-col space-y-1" key={arg.id}>
          <label className="space-x-1.5 font-mono text-sm font-medium text-neutral-700 dark:text-neutral-200">
            <span>{arg.name}</span>
            <span className="text-xs text-neutral-400">
              {arg.type.toLowerCase()}
            </span>
            <span className="text-red-500">{arg.required && "*"}</span>
          </label>

          {arg.type === "NUMBER" ? (
            <NumberInput
              defaultValue={arg.default ?? undefined}
              value={
                readOnly
                  ? arg.value
                  : values.find((value) => value.name === arg.name)?.value
              }
              onValueChange={(value) => setValue(arg.name, String(value))}
              disabled={readOnly}
              enableStepper={!readOnly}
              placeholder={
                readOnly && !arg.value
                  ? "No value"
                  : arg.default ?? `Enter ${arg.name}`
              }
              className={cn("w-full", readOnly && "bg-white")}
            />
          ) : arg.type === "BOOLEAN" ? (
            readOnly ? (
              <TextInput
                defaultValue={arg.default ?? undefined}
                disabled={readOnly}
                placeholder={
                  readOnly && !arg.value
                    ? "No value"
                    : arg.default ?? `Enter ${arg.name}`
                }
                value={arg.value}
                onValueChange={(value: string) => setValue(arg.name, value)}
                className={cn(
                  "w-full font-mono",
                  readOnly && "bg-white",
                  !arg.value && "font-base",
                )}
              />
            ) : (
              <Select
                defaultValue={arg.default ?? undefined}
                disabled={readOnly}
                value={values.find((value) => value.name === arg.name)?.value}
                onValueChange={(value) =>
                  setValue(arg.name, value === "" ? undefined : String(value))
                }
                className={cn(
                  "w-full *:text-[0.8rem]",
                  values.find((value) => value.name === arg.name)?.value &&
                    values.find((value) => value.name === arg.name)?.value !==
                      "" &&
                    "*:font-mono",
                )}
                enableClear={!arg.required}
              >
                <SelectItem value="true" className="font-mono">
                  true
                </SelectItem>
                <SelectItem value="false" className="font-mono">
                  false
                </SelectItem>
              </Select>
            )
          ) : arg.type === "PLAYER" || arg.type === "USER" ? (
            <PlayerSearch
              value={values.find((value) => value.name === arg.name)?.value}
              onValueChange={(value) => setValue(arg.name, value)}
              defaultValue={readOnly ? arg.value : arg.default ?? undefined}
              disabled={readOnly}
              required={arg.required}
            />
          ) : (
            <TextInput
              defaultValue={arg.default ?? undefined}
              disabled={readOnly}
              placeholder={
                readOnly && !arg.value
                  ? "No value"
                  : arg.default ?? `Enter ${arg.name}`
              }
              value={
                readOnly
                  ? arg.value
                  : values.find((value) => value.name === arg.name)?.value
              }
              onValueChange={(value: string) => setValue(arg.name, value)}
              className={cn("w-full", readOnly && "bg-white")}
            />
          )}
        </div>
      ))}
    </div>
  );
}
