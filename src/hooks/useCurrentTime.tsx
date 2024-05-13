import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useIndexedDb } from "./useIndexedDb";

const CURRENT_TIME = "current-time";

export const useCurrentTime = () => {
  const { indexedDb, isConnecting, isDbReady } = useIndexedDb(CURRENT_TIME, {});

  const query = useQuery<{ time: string }>({
    queryKey: [CURRENT_TIME],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 3000));

      return { time: new Date().toISOString() };
    },
  });

  return query;
};
