import { action, makeObservable, observable } from "mobx";
import { QueryObserver, queryOptions } from "@tanstack/react-query";
import { queryClient } from "./main";
import { indexedDbPersistedOptions } from "./hooks/useCurrentTime";

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

  private disposeQueryObserver = new QueryObserver(
    queryClient,
    mobxTimeQuery
  ).subscribe((res) => {
    this.time = res.data?.time;
  });

  constructor() {
    this.time = "foo";

    makeObservable(this);
  }

  @action.bound
  public async fetchTime() {
    await queryClient.prefetchQuery({ ...mobxTimeQuery });
  }

  @action.bound
  public dispose() {
    this.disposeQueryObserver();
  }
}
