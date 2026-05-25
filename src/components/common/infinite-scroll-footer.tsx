"use client";

import { Loader2 } from "lucide-react";
import type { RefObject } from "react";

type Props = {
  loadMoreRef: RefObject<HTMLDivElement | null>;
  isFetching: boolean;
  hasMore: boolean;
  shown: number;
  total?: number;
  label?: string;
};

export default function InfiniteScrollFooter({
  loadMoreRef,
  isFetching,
  hasMore,
  shown,
  total,
  label = "items",
}: Props) {
  return (
    <div
      ref={loadMoreRef}
      className="flex min-h-[72px] items-center justify-center px-2 py-5"
    >
      {isFetching ? (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 size={16} className="animate-spin" />
          Loading more {label}...
        </div>
      ) : hasMore ? (
        <p className="text-sm text-gray-400">
          Scroll down to load more {label}
        </p>
      ) : shown > 0 ? (
        <p className="text-sm text-gray-400">
          Showing {shown} of {total || shown} {label}
        </p>
      ) : null}
    </div>
  );
}