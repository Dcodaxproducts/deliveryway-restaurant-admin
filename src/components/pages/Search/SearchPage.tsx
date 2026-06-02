"use client";

import Link from "next/link";
import Container from "@/components/common/Container";
import { buildSearchHref } from "@/components/layout/navbar/global-search-config";
import { useCurrentScope } from "@/hooks/useCurrentScope";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";

type SearchPageProps = {
  initialQuery: string;
};

export function SearchPage({ initialQuery }: SearchPageProps) {
  const scope = useCurrentScope();
  const query = initialQuery.trim();
  const { data, isFetching, error } = useGlobalSearch({
    query,
    restaurantId: scope.restaurantId,
    branchId: scope.isBranchAdmin ? scope.branchId : undefined,
    enabled: query.length >= 2,
    limit: 10,
  });

  const hasResults = data?.groups.some((group) => group.results.length > 0) ?? false;

  return (
    <Container>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Search Results</h1>
          {query ? (
            <p className="mt-1 text-sm text-gray-500">Showing results for "{query}"</p>
          ) : null}
        </div>

        <div className="rounded-lg bg-white p-4 shadow-sm lg:p-6">
          {query.length < 2 ? (
            <p className="text-sm text-gray-500">Enter at least 2 characters to search.</p>
          ) : null}

          {query.length >= 2 && isFetching && !data ? (
            <p className="text-sm text-gray-500">Searching...</p>
          ) : null}

          {query.length >= 2 && error ? (
            <p className="text-sm text-red-500">Search is temporarily unavailable.</p>
          ) : null}

          {query.length >= 2 && !isFetching && !error && !hasResults ? (
            <p className="text-sm text-gray-500">No results found</p>
          ) : null}

          {query.length >= 2 && !error && hasResults ? (
            <div className="space-y-6">
              {data?.groups
                .filter((group) => group.results.length > 0)
                .map((group) => (
                  <section key={group.entity} className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-base font-semibold text-gray-900">{group.label}</h2>
                      <Link
                        href={buildSearchHref(group.href.split("?")[0] || group.href, query)}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        View all
                      </Link>
                    </div>

                    <div className="divide-y divide-gray-100 rounded-lg border border-gray-100">
                      {group.results.slice(0, 10).map((result) => (
                        <Link
                          key={`${result.entity}-${result.id}`}
                          href={result.href}
                          className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-gray-50"
                        >
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            {result.title.slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-medium text-gray-900">
                                {result.title}
                              </p>
                              {result.status ? (
                                <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">
                                  {result.status}
                                </span>
                              ) : null}
                            </div>
                            {result.subtitle ? (
                              <p className="truncate text-xs text-gray-500">{result.subtitle}</p>
                            ) : null}
                            {result.description ? (
                              <p className="truncate text-xs text-gray-400">
                                {result.description}
                              </p>
                            ) : null}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                ))}
            </div>
          ) : null}
        </div>
      </div>
    </Container>
  );
}
