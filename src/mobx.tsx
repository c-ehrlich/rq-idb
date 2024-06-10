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

export function queryClientFactory() {
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

export const QueryClientFactory = queryClientFactory();

export const mobxTimeQuery = queryOptions({
  queryKey: ["in-mobx"],
  queryFn: async () => {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return { time: new Date().toISOString() };
  },
  ...indexedDbPersistedOptions,
  staleTime: 5000,
});

export const QOSingletonPerQueryKey = (function () {
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
          new QueryObserver<any, any, any, any, any>(
            QueryClientFactory.getInstance(),
            qopts
          )
        );
      }

      return qoInstances.get(name) as QueryObserver<TData, Error, TData, TData>;
    },
  };
})();

export class MobxStore {
  @observable
  public time?: string;

  @action.bound
  private setTime(time?: string) {
    this.time = time;
  }

  private cleanupSubscription?: () => void;

  constructor() {
    this.time = QueryClientFactory.getInstance().getQueryData(
      mobxTimeQuery.queryKey
    )?.time;

    makeObservable(this);

    onBecomeObserved(this, "time", () => {
      this.cleanupSubscription = QOSingletonPerQueryKey.getInstance(
        mobxTimeQuery
      ).subscribe((res) => {
        this.setTime(res.data?.time);
      });
    });
    onBecomeUnobserved(this, "time", () => this.cleanup());
  }

  @action.bound
  public async fetchTime() {
    await QueryClientFactory.getInstance().prefetchQuery(mobxTimeQuery);
  }

  @action.bound
  public cleanup() {
    this.cleanupSubscription?.();
  }
}
