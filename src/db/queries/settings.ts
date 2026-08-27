import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { z } from "zod";
import { db } from "../client";
import { settings } from "../schema";

export const restSeconds = z.number().int().min(5).max(600);

export const settingsSchema = z.object({
  restBetweenSetsSec: restSeconds,
  restBetweenExercisesSec: restSeconds,
  autostartRestTimer: z.boolean(),
  timerSounds: z.boolean(),
  keepAwake: z.boolean(),
});

export type Settings = z.infer<typeof settingsSchema>;

export const DEFAULTS: Settings = {
  restBetweenSetsSec: 45,
  restBetweenExercisesSec: 90,
  autostartRestTimer: true,
  timerSounds: true,
  keepAwake: true,
};

// Merge the settings from the database with the default settings. If a setting is not found in the database, it will return the default value.
function merge(rows: { key: string; value: string }[]): Settings {
  const result = { ...DEFAULTS };
  for (const { key, value } of rows) {
    const field = settingsSchema.shape[key as keyof Settings];
    if (!field) continue;
    try {
      const parsed = field.safeParse(JSON.parse(value));
      if (parsed.success) Object.assign(result, { [key]: parsed.data });
    } catch {
      // Ignore invalid JSON and keep the default.
    }
  }
  return result;
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
  const encoded = JSON.stringify(settingsSchema.shape[key].parse(value));
  await db
    .insert(settings)
    .values({ key, value: encoded })
    .onConflictDoUpdate({ target: settings.key, set: { value: encoded } });
}
