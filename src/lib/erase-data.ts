import { db } from "@/db/client";
import {
  exercises,
  routineExercises,
  routines,
  sessionSets,
  sessions,
  settings,
} from "@/db/schema";
import { clearMediaDir } from "@/lib/media";
import { useSessionStore } from "@/lib/session-store";

export function eraseAllData() {
  db.transaction((tx) => {
    tx.delete(sessionSets).run();
    tx.delete(sessions).run();
    tx.delete(routineExercises).run();
    tx.delete(routines).run();
    tx.delete(exercises).run();
    tx.delete(settings).run();
  });
  useSessionStore.getState().end();
  clearMediaDir();
}
