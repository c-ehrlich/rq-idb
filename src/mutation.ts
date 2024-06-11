/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  DefaultError,
  MutateOptions,
  MutationObserver,
  QueryClient,
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
  notifyManager,
  useQueryClient,
} from "@tanstack/react-query";
import React from "react";
import { QueryClientSingleton } from "./mobx";

function shouldThrowError<T extends (...args: Array<any>) => boolean>(
  throwError: boolean | T | undefined,
  params: Parameters<T>
): boolean {
  // Allow throwError function to override throwing behavior on a per-error basis
  if (typeof throwError === "function") {
    return throwError(...params);
  }

  return !!throwError;
}

export function noop() {}

export function useMutation<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown
>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>,
  queryClient?: QueryClient
): UseMutationResult<TData, TError, TVariables, TContext> {
  const client = useQueryClient(queryClient);

  const [observer] = React.useState(
    () =>
      new MutationObserver<TData, TError, TVariables, TContext>(client, options)
  );

  React.useEffect(() => {
    observer.setOptions(options);
  }, [observer, options]);

  const result = React.useSyncExternalStore(
    React.useCallback(
      (onStoreChange) =>
        observer.subscribe(notifyManager.batchCalls(onStoreChange)),
      [observer]
    ),
    () => observer.getCurrentResult(),
    () => observer.getCurrentResult()
  );

  const mutate = React.useCallback<
    UseMutateFunction<TData, TError, TVariables, TContext>
  >(
    (variables, mutateOptions) => {
      observer.mutate(variables, mutateOptions).catch(noop);
    },
    [observer]
  );

  if (
    result.error &&
    shouldThrowError(observer.options.throwOnError, [result.error])
  ) {
    throw result.error;
  }

  return { ...result, mutate, mutateAsync: result.mutate };
}

export class MobxMutation<TData, TError, TVariables, TContext> {
  private client = QueryClientSingleton.getInstance();
  private observer: MutationObserver<TData, TError, TVariables, TContext>;

  /**
   * interface
   */
  public context: TContext | undefined;
  public lastMutationResult: TData | undefined;
  public mutate = (
    variables: TVariables,
    mutationOptions?: MutateOptions<TData, TError, TVariables, TContext>
  ) => {
    this.observer.mutate(variables, mutationOptions);
  };
  public mutateAsync = async (
    variables: TVariables,
    mutationOptions?: MutateOptions<TData, TError, TVariables, TContext>
  ): Promise<TData> => {
    return this.observer.mutate(variables, mutationOptions);
  };

  constructor(
    options: UseMutationOptions<TData, TError, TVariables, TContext>
  ) {
    this.observer = new MutationObserver(this.client, options);

    this.observer.subscribe((res) => {
      if (
        res.error &&
        shouldThrowError(this.observer.options.throwOnError, [res.error])
      ) {
        throw res.error;
      }
      this.context = res.context;
      this.lastMutationResult = res.data;
    });
  }
}
