import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { db } from "../client";
import { settings } from "../schema";

export type Settings = {
  restBetweenSetsSec: number;
  restBetweenExercisesSec: number;
  autostartRestTimer: boolean;
  timerSounds: boolean;
  keepAwake: boolean;
};

export const DEFAULTS: Settings = {
  restBetweenSetsSec: 45,
  restBetweenExercisesSec: 90,
  autostartRestTimer: true,
  timerSounds: true,
  keepAwake: true,
};

// Merge the settings from the database with the default settings. If a setting is not found in the database, it will return the default value.
function merge(rows: { key: string; value: string }[]): Settings {
  const stored = Object.fromEntries(
    rows.map((r) => [r.key, JSON.parse(r.value)]),
  );
  return { ...DEFAULTS, ...stored };
}

// Get the settings from the database and subscribe to changes. If a setting is not found, it will return the default value.
export function useSettings(): Settings {
  const { data } = useLiveQuery(db.select().from(settings));
  return merge(data);
}

// Get the settings from the database. If a setting is not found, it will return the default value.
export async function getSettings(): Promise<Settings> {
  return merge(await db.select().from(settings));
}

// Set a setting value in the database. If the key already exists, it will be updated.
export async function setSetting<K extends keyof Settings>(
  key: K,
  value: Settings[K],
) {
  const encoded = JSON.stringify(value);
  await db
    .insert(settings)
    .values({ key, value: encoded })
    .onConflictDoUpdate({ target: settings.key, set: { value: encoded } });
}
