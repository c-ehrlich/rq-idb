import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { getQueryObserverInstance, mobxTimeQuery } from "./mobx";

export function QOTest() {
  const [show, setShow] = useState(true);
  const queryClient = useQueryClient();

  return (
    <div>
      <h1>
        open two windows of this, click "hide" in one, invalidation now no
        longer works across tabs because _both_ windows lose their observer
      </h1>
      <button onClick={() => setShow((s) => !s)}>
        {show ? "hide" : "show"}
      </button>
      {show && <QOTestInner />}
      <button onClick={() => queryClient.invalidateQueries(mobxTimeQuery)}>
        invalidate
      </button>
    </div>
  );
}

function useQueryObserver() {
  const queryClient = useQueryClient();

  const [qo] = useState(() => getQueryObserverInstance(mobxTimeQuery));

  const [time, setTime] = useState<string | undefined>(
    () => queryClient.getQueryData(mobxTimeQuery.queryKey)?.time
  );

  const cleanupSubscriptionRef = useRef<() => void>();

  useEffect(() => {
    cleanupSubscriptionRef.current = qo.subscribe((res) => {
      setTime(res.data?.time);
    });

    return () => {
      cleanupSubscriptionRef.current?.();
    };
  }, [qo]);

  return { time, qo };
}

function QOTestInner() {
  const { time, qo } = useQueryObserver();

  return (
    <div>
      <pre>{JSON.stringify(time)}</pre>
      <pre>Has listeners: {JSON.stringify(qo.hasListeners())}</pre>
    </div>
  );
}
