import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useIndexedDb } from "./useIndexedDb";

const FRUITS_STORE = "fruits";

export const useFruitsStore = () => {
  const queryClient = useQueryClient();
  const { indexedDb, isConnecting, isDbReady } = useIndexedDb(FRUITS_STORE, {
    async upgrade(database) {
      if (!database.objectStoreNames.contains(FRUITS_STORE)) {
        const fruitObjectStore = database.createObjectStore(FRUITS_STORE, {
          keyPath: "fruitid",
        });

        fruitObjectStore.createIndex("name", "name", { unique: false });
      }
    },
  });

  const { data: fruits, isLoading: isFruitsLoading } = useQuery<
    Array<{
      fruitid: string;
      name: string;
    }>
  >({
    queryKey: ["fruits-query"],
    queryFn: async () => {
      try {
        if (!indexedDb) {
          return [];
        }
        const fruits = await indexedDb.getAll(FRUITS_STORE);
        return fruits || [];
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
    enabled: isDbReady,
  });

  const { mutateAsync: addFruit, isPending: isAddFruitPending } = useMutation({
    mutationFn: async (fruit: string) => {
      if (!indexedDb) {
        throw new Error("FRUITS STORE NOT READY");
      }
      await indexedDb.add(FRUITS_STORE, {
        fruitid: Math.random(),
        name: fruit,
      });
    },
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: ["fruits-query"],
      });
    },
  });

  const { mutateAsync: deleteFruit, isPending: isDeleteFruitPending } =
    useMutation({
      mutationFn: async (fruitId: string) => {
        if (!indexedDb) {
          throw new Error("FRUITS STORE NOT READY");
        }
        await indexedDb.delete(FRUITS_STORE, fruitId);
      },
      onSuccess() {
        queryClient.invalidateQueries({
          queryKey: ["fruits-query"],
        });
      },
    });

  return {
    indexedDb,
    fruits: fruits || [],
    isLoading: isConnecting || isFruitsLoading,
    isReady: isDbReady,
    addFruit,
    isAddFruitPending,
    deleteFruit,
    isDeleteFruitPending,
  };
};
