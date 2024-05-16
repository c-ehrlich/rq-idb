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
  let instance: QueryObserver<
    {
      time: string;
    },
    Error,
    {
      time: string;
    },
    {
      time: string;
    },
    string[]
  >;

  return {
    getInstance: function () {
      if (!instance) {
        instance = new QueryObserver(queryClient, mobxTimeQuery);
      }
      return instance;
    },
  };
})();

export class MobxStore {
  @observable
  public time?: string;

  private cleanupSubscription?: () => void;

  @action.bound
  private setTime(time?: string) {
    this.time = time;
  }

  constructor() {
    this.time = queryClient.getQueryData(mobxTimeQuery.queryKey)?.time;

    makeObservable(this);

    onBecomeObserved(this, "time", () => {
      this.cleanupSubscription = QOSingleton.getInstance().subscribe((res) => {
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
