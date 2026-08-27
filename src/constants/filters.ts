import { MeasuredBy } from "@/lib/enums";

export type MeasuredByFilter = "all" | MeasuredBy;

export const MEASURED_BY_FILTERS = [
  { value: "all", label: "All" },
  { value: MeasuredBy.Reps, label: "Reps" },
  { value: MeasuredBy.Time, label: "Time" },
  { value: MeasuredBy.Other, label: "Other" },
] as const satisfies readonly { value: MeasuredByFilter; label: string }[];
