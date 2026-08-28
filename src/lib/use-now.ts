import { useEffect, useState } from "react";

// Re-renders once a second so clocks derived from timestamps stay current. The interval
// carries no state of its own — the time shown is always `now - someTimestamp`.
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}
