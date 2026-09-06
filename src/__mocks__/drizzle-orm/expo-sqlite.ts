// Runs the query synchronously in place of drizzle's live hook. `live.loading` mimics the first render, before data arrives.
export const live = { loading: false };

export function useLiveQuery<T>(query: { all(): T[] }) {
  return live.loading
    ? { data: [] as T[], error: undefined, updatedAt: undefined }
    : { data: query.all(), error: undefined, updatedAt: new Date() };
}
