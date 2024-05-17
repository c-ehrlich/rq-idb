import { useState } from "react";
import { MobxStore, mobxTimeQuery } from "./mobx";
import { observer, useLocalObservable } from "mobx-react-lite";
import { useQuery, useQueryClient } from "@tanstack/react-query";

function App() {
  const [showRq, setShowRq] = useState(true);
  const [showMobX, setShowMobX] = useState(true);

  return (
    <div style={{ display: "flex", gap: "16px" }}>
      <div style={{ border: "1px solid red", padding: "16px" }}>
        <h1>MobX</h1>
        <button onClick={() => setShowMobX(!showMobX)}>
          {showMobX ? "hide" : "show"}
        </button>
        {showMobX && <MobX />}
      </div>
      <div style={{ border: "1px solid blue", padding: "16px" }}>
        <h1>React Query</h1>
        <button onClick={() => setShowRq(!showRq)}>
          {showRq ? "hide" : "show"}
        </button>
        {showRq && <Rq />}
      </div>
      <div style={{ border: "1px solid green", padding: "16px" }}>
        <h1>QueryClient</h1>
        <Invalidate />
      </div>
    </div>
  );
}

const Rq = () => {
  const rqQuery = useQuery(mobxTimeQuery);

  return (
    <div>
      <pre>
        {rqQuery.isLoading ? "loading..." : JSON.stringify(rqQuery.data?.time)}
      </pre>
      <button onClick={() => rqQuery.refetch()}>
        Refetch in React Query using refetch()
      </button>
    </div>
  );
};

const MobX = observer(function MobX() {
  const mobxStore = useLocalObservable(() => new MobxStore());
  const { time: mobxTime, fetchTime: mobxFetchTime } = mobxStore;

  return (
    <div>
      <pre>{JSON.stringify(mobxTime)}</pre>
      <button onClick={mobxFetchTime}>
        Refetch inside MobX using prefetchQuery()
      </button>
    </div>
  );
});

const Invalidate = () => {
  const queryClient = useQueryClient();

  return (
    <div>
      <button onClick={() => queryClient.invalidateQueries(mobxTimeQuery)}>
        queryClient.invalidateQueries()
      </button>
    </div>
  );
};

export default App;
