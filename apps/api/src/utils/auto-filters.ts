import {
  type AutoFilterField,
  type PresetAutoFilter,
  type PresetAutoFilters,
} from "@metrik/db/client";

export const autoFilters = [
  {
    name: "COREGUI_SCRIPTS",
    field: "SCRIPT_PATH",
    pattern: "tbd",
  },
] satisfies {
  name: PresetAutoFilters;
  field: AutoFilterField;
  pattern: string;
}[];
