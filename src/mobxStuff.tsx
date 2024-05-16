import { action, makeObservable, observable } from "mobx";
import { QueryObserver, queryOptions } from "@tanstack/react-query";
import { queryClient } from "./main";
import { indexedDbPersistedOptions } from "./indexedDbStuff";

export const mobxTimeQuery = queryOptions({
  queryKey: ["in-mobx"],
  queryFn: async () => {
    await new Promise((resolve) => setTimeout(resolve, 3000));

    return { time: new Date().toISOString() };
  },
  ...indexedDbPersistedOptions,
  staleTime: 10000,
});

export class MobxStore {
  @observable
  public time?: string;
  // private destroyObserver: () => void;

  private cleanupSubscription: () => void;
  constructor() {
    this.cleanupSubscription = new QueryObserver(
      queryClient,
      mobxTimeQuery
    ).subscribe((res) => {
      this.time = res.data?.time;
    });

    // const disposeQueryObserver = new QueryObserver(queryClient, mobxTimeQuery);
    // this.destroyObserver = disposeQueryObserver.destroy;

    console.log("tktk constructor");
    this.time = queryClient.getQueryData(mobxTimeQuery.queryKey)?.time;

    makeObservable(this);
  }

  @action.bound
  public async fetchTime() {
    await queryClient.prefetchQuery({ ...mobxTimeQuery });
  }

  @action.bound
  public dispose() {
    this.cleanupSubscription();
    // this.destroyObserver();
  }
}
