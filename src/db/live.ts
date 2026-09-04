import { addDatabaseChangeListener } from "expo-sqlite";
import { useEffect, useState } from "react";

export function useLiveTables<T>(
  run: () => T,
  tables: string[],
  deps: unknown[] = [],
): T | undefined {
  const [data, setData] = useState<T>();
  const key = tables.join(",");

  useEffect(() => {
    let pending = false;
    let disposed = false;
    const refresh = () => {
      if (pending) return;
      pending = true;
      setTimeout(() => {
        pending = false;
        if (!disposed) setData(run());
      }, 0);
    };
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial read from SQLite; the listener only fires on later external changes
    setData(run());
    const listener = addDatabaseChangeListener(({ tableName }) => {
      if (tables.includes(tableName)) refresh();
    });
    return () => {
      disposed = true;
      listener.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `run` is deliberately re-captured only when key/deps change
  }, [key, ...deps]);

  return data;
}
