import { useCurrentTime } from "./hooks/useCurrentTime";

export function IdbTest() {
  const timeQuery = useCurrentTime();

  return (
    <div>
      <pre>
        {timeQuery.isLoading ? "loading..." : JSON.stringify(timeQuery.data)}
      </pre>
    </div>
  );
}
