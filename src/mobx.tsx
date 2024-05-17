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

type T = { time: string };
const QOSingleton = (function () {
  let instance: QueryObserver<T, Error, T, T, string[]>;

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

  @action.bound
  private setTime(time?: string) {
    this.time = time;
  }

  private cleanupSubscription?: () => void;

  constructor() {
    this.time = queryClient.getQueryData(mobxTimeQuery.queryKey)?.time;

    makeObservable(this);

    // TODO: this is why we get multiple listeners https://github.com/mobxjs/mobx/issues/2667

    onBecomeObserved(this, "time", () => {
      this.fetchTime();
      this.cleanupSubscription = QOSingleton.getInstance().subscribe((res) => {
        console.log("onBecomeObserved");
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
    await queryClient.prefetchQuery(mobxTimeQuery);
  }

  @action.bound
  public cleanup() {
    this.cleanupSubscription?.();
  }
}
