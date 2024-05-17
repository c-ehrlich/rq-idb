import {
  IAtom,
  action,
  computed,
  createAtom,
  makeObservable,
  observable,
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

/**
 * soooo
 * this works, except that when one tab has no observers the other one also has none
 * btw the pre changes version has the same properties, _maybe_ cleans up listeners a bit worse?
 */

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
  timeAtom: IAtom;

  @observable
  private _time?: string = queryClient.getQueryData(mobxTimeQuery.queryKey)
    ?.time;

  public get time() {
    console.log("tktk get time", this._time);
    if (!this.timeAtom.reportObserved()) {
      console.log("No observers");
      return "no observers!!";
    }

    return this._time;
  }

  @action.bound
  private setTime(time?: string) {
    this._time = time;
  }

  private cleanupSubscriptions: (() => void)[] = [];

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    this.timeAtom = createAtom(
      "Time",
      function onBecomeObserved() {
        console.log("onBecomeObserved");
        self.fetchTime();
        self.cleanupSubscriptions.push(
          QOSingleton.getInstance().subscribe((res) => {
            self.setTime(res.data?.time);
          })
        );
      },
      function onBecomeUnobserved() {
        console.log("onBecomeUnobserved");
        self.cleanup();
      }
    );

    makeObservable(this);
  }

  @action.bound
  public async fetchTime() {
    await queryClient.prefetchQuery(mobxTimeQuery);
  }

  @action.bound
  public cleanup() {
    this.cleanupSubscriptions.forEach((cleanup) => cleanup());
  }
}
