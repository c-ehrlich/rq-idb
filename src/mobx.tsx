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
  QueryObserver,
  QueryObserverOptions,
  QueryOptions,
  queryOptions,
} from "@tanstack/react-query";
import { queryClient } from "./main";
import { indexedDbPersistedOptions } from "./indexedDB";

export const mobxTimeQuery = queryOptions({
  queryKey: ["in-mobx"],
  queryFn: async () => {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return { time: new Date().toISOString() };
  },
  ...indexedDbPersistedOptions,
  staleTime: 5000,
});

const QOSingletonOld = (function () {
  const instances: Record<string, QueryObserver> = {};

  return {
    getInstance: function (name: string) {
      if (!instances[name]) {
        instances[name] = new QueryObserver(queryClient, mobxTimeQuery) as any;
      }
      return instances[name];
    },
  };
})();

const QOSingleton = (function () {
  const instances = new Map<string, QueryObserver>();

  return {
    getInstance: function <T>(
      qopts: QueryObserverOptions<T, Error, T, any, any>
    ): QueryObserver<T> {
      if (!qopts.queryKey) {
        throw new Error("queryKey is required");
      }

      const name = hashKey(qopts.queryKey);

      if (!instances.has(name)) {
        instances.set(name, new QueryObserver(queryClient, qopts) as any);
      }
      return instances.get(name) as any;
    },
  };
})();

const qopts = queryOptions({
  queryKey: ["in-mobx", { foo: "bar" }],
  queryFn: async () => {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return { time: new Date().toISOString() };
  },
  ...indexedDbPersistedOptions,
  staleTime: 5000,
});

const qos2 = QOSingleton.getInstance(qopts);

export class MobxStore {
  @observable
  public time?: string;

  @action.bound
  private setTime(time?: string) {
    this.time = time;
  }

  private cleanupSubscription?: () => void;

  constructor() {
    this.time = queryClient.getQueryData(mobxTimeQuery.queryKey)?.time;

    makeObservable(this);

    onBecomeObserved(this, "time", () => {
      this.cleanupSubscription = QOSingleton.getInstance(
        mobxTimeQuery
      ).subscribe((res) => {
        this.setTime(res.data?.time);
      });
    });
    onBecomeUnobserved(this, "time", () => this.cleanup());
  }

  @action.bound
  public async fetchTime() {
    await queryClient.prefetchQuery(mobxTimeQuery);
  }

  @action.bound
  public cleanup() {
    this.cleanupSubscription?.();
  }
}
