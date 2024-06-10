/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  action,
  makeObservable,
  observable,
  onBecomeObserved,
  onBecomeUnobserved,
} from "mobx";
import { QueryObserver, queryOptions } from "@tanstack/react-query";
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

const QOSingleton = (function () {
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

const QOSingleton2 = (function () {
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
      this.cleanupSubscription = QOSingleton.getInstance("time").subscribe(
        (res) => {
          this.setTime(res.data?.time);
        }
      );
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
