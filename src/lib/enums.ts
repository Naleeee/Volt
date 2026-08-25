// Drizzle's `enum:` option requires a non-empty tuple, which Object.values() can't express
function values<T extends Record<string, string>>(obj: T) {
  return Object.values(obj) as [T[keyof T], ...T[keyof T][]];
}

export const MeasuredBy = {
  Reps: "reps",
  Time: "time",
  Other: "other",
} as const;
export type MeasuredBy = (typeof MeasuredBy)[keyof typeof MeasuredBy];
export const MEASURED_BY = values(MeasuredBy);

export const MediaType = {
  Photo: "photo",
  Gif: "gif",
  Video: "video",
} as const;
export type MediaType = (typeof MediaType)[keyof typeof MediaType];
export const MEDIA_TYPES = values(MediaType);
