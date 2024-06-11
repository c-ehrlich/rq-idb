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
  QueryObserverResult,
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

const QueryObservers = (function () {
  const qoInstances = new Map<string, QueryObserver>();

  return {
    get: function <TData>(
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

    cleanup: (qopts: QueryObserverOptions<any, Error, any, any, any>) => {
      const instance = qoInstances.get(hashKey(qopts.queryKey));
      if (instance && !instance.hasListeners()) {
        instance.destroy();
        qoInstances.delete(hashKey(qopts.queryKey));
      }
    },
  };
})();

export const getQueryObserverInstance = QueryObservers.get;
export const cleanupQueryObserver = QueryObservers.cleanup;

type MobxQuery<TData, TError = Error> = QueryObserverResult<TData, TError>;

export class MobxStore {
  @observable
  public timeQuery: MobxQuery<{ time: string }>;

  @action.bound
  private setTime(newTime: MobxQuery<{ time: string }>) {
    this.timeQuery = newTime;
  }

  private cleanupSubscription?: () => void;

  constructor() {
    this.timeQuery = getQueryObserverInstance(mobxTimeQuery).getCurrentResult();

    makeObservable(this);

    onBecomeObserved(this, "timeQuery", () => {
      this.cleanupSubscription = getQueryObserverInstance(
        mobxTimeQuery
      ).subscribe((res) => {
        this.setTime(res);
        // (any side effects, just like the callback in `operate`)
      });
    });
    onBecomeUnobserved(this, "timeQuery", () => {
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

export const otherMobxQuery = queryOptions({
  queryKey: ["other-mobx"],
  queryFn: async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    return { time: new Date().toISOString() };
  },
  staleTime: 5000,
});

export class OtherMobxStore {
  @observable
  public timeQuery: MobxQuery<{ time: string }>;

  @action.bound
  private setTime(newTime: MobxQuery<{ time: string }>) {
    this.timeQuery = newTime;
  }

  private cleanupSubscription?: () => void;

  constructor() {
    this.timeQuery =
      getQueryObserverInstance(otherMobxQuery).getCurrentResult();

    makeObservable(this);

    onBecomeObserved(this, "timeQuery", () => {
      this.cleanupSubscription = getQueryObserverInstance(
        otherMobxQuery
      ).subscribe((res) => {
        this.setTime(res);
        // (any side effects, just like the callback in `operate`)
      });
    });
    onBecomeUnobserved(this, "timeQuery", () => {
      this.cleanup();
    });
  }

  @action.bound
  public async fetchTime() {
    await getQueryClient().prefetchQuery(otherMobxQuery);
  }

  @action.bound
  public cleanup() {
    this.cleanupSubscription?.();
    cleanupQueryObserver(otherMobxQuery);
  }
}
