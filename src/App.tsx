import { useEffect, useState } from "react";
import { MobxStore, mobxTimeQuery } from "./mobx";
import { observer, useLocalObservable } from "mobx-react-lite";
import { useQuery } from "@tanstack/react-query";

function App() {
  const [show, setShow] = useState(true);

  return (
    <div>
      <button onClick={() => setShow(!show)}>{show ? "hide" : "show"}</button>
      {show && <IndexedDb />}
    </div>
  );
}

const IndexedDb = observer(function IndexedDb() {
  const mobxStore = useLocalObservable(() => new MobxStore());
  const { time: mobxTime, fetchTime: mobxFetchTime } = mobxStore;

  const mobxQuery = useQuery(mobxTimeQuery);

  useEffect(() => {
    const { fetchTime, dispose } = mobxStore;
    fetchTime();

    return () => dispose();
  }, [mobxStore]);

  return (
    <div>
      <pre>
        In React Query:{" "}
        {mobxQuery.isLoading ? "loading..." : JSON.stringify(mobxQuery.data)}
      </pre>
      <button onClick={() => mobxQuery.refetch()}>
        Refetch in React Query
      </button>
      <pre>In the MobX Store {mobxTime}</pre>
      <button onClick={mobxFetchTime}>
        Refetch inside MobX using prefetchQuery
      </button>
    </div>
  );
});

export default App;
