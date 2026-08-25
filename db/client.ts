import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import * as schema from "./schema";

// enableChangeListener is required for useLiveQuery to re-render on writes
const expo = openDatabaseSync("volt.db", { enableChangeListener: true });

expo.execSync("PRAGMA foreign_keys = ON");

export const db = drizzle(expo, { schema });
