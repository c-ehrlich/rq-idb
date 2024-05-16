import { useEffect, useState } from "react";
import { useCurrentTimeIdb, useCurrentTimeNoIdb } from "./hooks/useCurrentTime";
import { MobxStore, mobxTimeQuery } from "./MobxComponent";
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
  const idbQuery = useCurrentTimeIdb();
  const nonIdbQuery = useCurrentTimeNoIdb();
  const mobxStore = useLocalObservable(() => new MobxStore());
  const { time: mobxTime, fetchTime: mobxFetchTime } = mobxStore;

  const mobxQuery = useQuery(mobxTimeQuery);

  useEffect(() => {
    const { fetchTime } = mobxStore;
    fetchTime();
  }, [mobxStore]);

  return (
    <div>
      <pre>
        With idb:{" "}
        {idbQuery.isLoading ? "loading..." : JSON.stringify(idbQuery.data)}
      </pre>
      <pre>
        Without idb:{" "}
        {nonIdbQuery.isLoading
          ? "loading..."
          : JSON.stringify(nonIdbQuery.data)}
      </pre>
      <pre>
        From mobx:{" "}
        {mobxQuery.isLoading ? "loading..." : JSON.stringify(mobxQuery.data)}
      </pre>
      <pre>and inside the store... {mobxTime}</pre>
      <button onClick={mobxFetchTime}>Fetch with MobX</button>
    </div>
  );
});

export default App;
