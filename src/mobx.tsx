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

export const QueryClientSingleton = (function CreateSingleton() {
  const instance = new QueryClient();

  return {
    getInstance: () => {
      return instance;
    },
  };
})();

export const mobxTimeQuery = queryOptions({
  queryKey: ["in-mobx"],
  queryFn: async () => {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return { time: new Date().toISOString() };
  },
  ...indexedDbPersistedOptions,
  staleTime: 5000,
});

export const MobXQueryObservers = (function CreateSingleton() {
  const qoInstances = new Map<string, QueryObserver>();

  const get = <TData,>(
    qopts: QueryObserverOptions<TData, Error, TData, any, any>
  ): QueryObserver<TData, Error, TData, TData> => {
    if (!qopts.queryKey) {
      throw new Error("queryKey is required");
    }

    const name = hashKey(qopts.queryKey);

    const queryClient = QueryClientSingleton.getInstance();

    if (!qoInstances.has(name)) {
      qoInstances.set(
        name,
        new QueryObserver<any, any, any, any, any>(queryClient, qopts)
      );
    }

    return qoInstances.get(name) as QueryObserver<TData, Error, TData, TData>;
  };

  const cleanup = (qopts: QueryObserverOptions<any, Error, any, any, any>) => {
    const instance = qoInstances.get(hashKey(qopts.queryKey));
    if (instance && !instance.hasListeners()) {
      instance.destroy();
      qoInstances.delete(hashKey(qopts.queryKey));
    }
  };

  return {
    get,
    cleanup,
  };
})();

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
    const timeQueryObserver = MobXQueryObservers.get(mobxTimeQuery);
    this.timeQuery = timeQueryObserver.getCurrentResult();

    makeObservable(this);

    onBecomeObserved(this, "timeQuery", () => {
      this.cleanupSubscription = timeQueryObserver.subscribe((res) => {
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
    const queryClient = QueryClientSingleton.getInstance();
    await queryClient.prefetchQuery(mobxTimeQuery);
  }

  @action.bound
  public cleanup() {
    this.cleanupSubscription?.();
    MobXQueryObservers.cleanup(mobxTimeQuery);
  }
}

// this is just a duplicate of the query and store above, but with a different key
// to test QueryObserver cleanup

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
  private updateTimeQuery(newTime: MobxQuery<{ time: string }>) {
    this.timeQuery = newTime;
  }

  private cleanupSubscription?: () => void;

  constructor() {
    const otherQueryObserver = MobXQueryObservers.get(otherMobxQuery);
    this.timeQuery = otherQueryObserver.getCurrentResult();

    makeObservable(this);

    onBecomeObserved(this, "timeQuery", () => {
      this.cleanupSubscription = otherQueryObserver.subscribe((res) => {
        this.updateTimeQuery(res);
        // (any side effects, just like the callback in `operate`)
      });
    });
    onBecomeUnobserved(this, "timeQuery", () => {
      this.cleanup();
    });
  }

  @action.bound
  public async fetchTime() {
    const queryClient = QueryClientSingleton.getInstance();
    await queryClient.prefetchQuery(otherMobxQuery);
  }

  @action.bound
  public cleanup() {
    this.cleanupSubscription?.();
    MobXQueryObservers.cleanup(otherMobxQuery);
  }
}
