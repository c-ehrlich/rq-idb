/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  action,
  makeObservable,
  observable,
  onBecomeObserved,
  onBecomeUnobserved,
} from "mobx";
import {
  hashKey,
  QueryClient,
  QueryObserver,
  QueryObserverOptions,
  queryOptions,
} from "@tanstack/react-query";
import { indexedDbPersistedOptions } from "./indexedDB";

function queryClientFactory() {
  let instance: QueryClient;

  function createInstance() {
    console.log("creating instance");
    return new QueryClient();
  }

  return {
    getInstance: function () {
      if (!instance) {
        instance = createInstance();
      }
      return instance;
    },
  };
}

export const getQueryClient = queryClientFactory().getInstance;

export const mobxTimeQuery = queryOptions({
  queryKey: ["in-mobx"],
  queryFn: async () => {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return { time: new Date().toISOString() };
  },
  ...indexedDbPersistedOptions,
  staleTime: 5000,
});

const QOSingletonPerQueryKey = (function () {
  const qoInstances = new Map<string, QueryObserver>();

  return {
    getInstance: function <TData>(
      qopts: QueryObserverOptions<TData, Error, TData, any, any>
    ): QueryObserver<TData, Error, TData, TData> {
      if (!qopts.queryKey) {
        throw new Error("queryKey is required");
      }

      const name = hashKey(qopts.queryKey);

      if (!qoInstances.has(name)) {
        qoInstances.set(
          name,
          new QueryObserver<any, any, any, any, any>(getQueryClient(), qopts)
        );
      }

      return qoInstances.get(name) as QueryObserver<TData, Error, TData, TData>;
    },
  };
})();

export const getQueryObserverInstance = QOSingletonPerQueryKey.getInstance;

export class MobxStore {
  @observable
  public time?: string;

  @action.bound
  private setTime(time?: string) {
    this.time = time;
  }

  private cleanupSubscription?: () => void;

  constructor() {
    this.time = getQueryClient().getQueryData(mobxTimeQuery.queryKey)?.time;

    makeObservable(this);

    onBecomeObserved(this, "time", () => {
      this.cleanupSubscription = getQueryObserverInstance(
        mobxTimeQuery
      ).subscribe((res) => {
        this.setTime(res.data?.time);
      });
    });
    onBecomeUnobserved(this, "time", () => {
      console.log("onBecomeUnobserved");
      this.cleanup();
    });
  }

  @action.bound
  public async fetchTime() {
    await getQueryClient().prefetchQuery(mobxTimeQuery);
  }

  @action.bound
  public cleanup() {
    this.cleanupSubscription?.();
  }
}
