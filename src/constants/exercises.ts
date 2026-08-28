import { colors } from "@/constants/theme";
import { MeasuredBy } from "@/lib/enums";

export type MeasuredByFilter = "all" | MeasuredBy;

export const MEASURED_BY_FILTERS = [
  { value: "all", label: "All" },
  { value: MeasuredBy.Reps, label: "Reps" },
  { value: MeasuredBy.Time, label: "Time" },
  { value: MeasuredBy.Other, label: "Other" },
] as const satisfies readonly { value: MeasuredByFilter; label: string }[];

// Per-type styling. `color` is the hex for Reanimated/props; the rest are NativeWind classes.
export const MEASURED_BY_STYLES: Record<
  MeasuredBy,
  { color: string; text: string; box: string; edge: string; ring: string }
> = {
  [MeasuredBy.Reps]: {
    color: colors.accent,
    text: "text-accent",
    box: "border-accent/35",
    edge: "border-l-accent",
    ring: "border-accent",
  },
  [MeasuredBy.Time]: {
    color: colors.time,
    text: "text-time",
    box: "border-time/35",
    edge: "border-l-time",
    ring: "border-time",
  },
  [MeasuredBy.Other]: {
    color: colors.other,
    text: "text-other",
    box: "border-other/35",
    edge: "border-l-other",
    ring: "border-other",
  },
};
