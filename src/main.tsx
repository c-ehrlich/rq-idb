import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { broadcastQueryClient } from "@tanstack/query-broadcast-client-experimental";

export const queryClient = new QueryClient();

broadcastQueryClient({
  queryClient,
  broadcastChannel: "example-channel",
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);
