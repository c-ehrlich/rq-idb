import { action, makeObservable, observable } from "mobx";
import { QueryObserver, queryOptions } from "@tanstack/react-query";
import { queryClient } from "./main";
import { indexedDbPersistedOptions } from "./indexedDB";

export const mobxTimeQuery = queryOptions({
  queryKey: ["in-mobx"],
  queryFn: async () => {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return { time: new Date().toISOString() };
  },
  // ...indexedDbPersistedOptions,
  staleTime: 5000,
});

export class MobxStore {
  @observable
  public time?: string;

  private cleanupSubscription = new QueryObserver(
    queryClient,
    mobxTimeQuery
  ).subscribe((res) => {
    console.log("tktk subscription", res);
    console.log("tktk this", this);
    this.time = res.data?.time;

    console.log("tktk subscription", this.time);
  });

  constructor() {
    makeObservable(this);
  }

  @action.bound
  public async fetchTime() {
    await queryClient.prefetchQuery({ ...mobxTimeQuery });
  }

  @action.bound
  public whatsthetime() {
    console.log("tktk whatsthetime", this.time);
  }

  // @action.bound
  // public dispose() {
  //   this.cleanupSubscription();
  // }
}
