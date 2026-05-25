"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import type { DehydratedState } from "@tanstack/react-query";
import { HydrationBoundary, QueryClientProvider } from "@tanstack/react-query";

import { createQueryClient } from "@/lib/query-client";

export interface ReactQueryProviderProps {
  children: ReactNode;
  dehydratedState?: DehydratedState;
}

export default function ReactQueryProvider({
  children,
  dehydratedState,
}: ReactQueryProviderProps) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={dehydratedState}>{children}</HydrationBoundary>
    </QueryClientProvider>
  );
}
