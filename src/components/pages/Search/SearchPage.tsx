"use client";

import Link from "next/link";
import Container from "@/components/common/Container";
import { StatePanel } from "@/components/common/EmptyState";
import PageHeader from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { StatusBadge } from "@/components/common/status-badge";
import { buildSearchHref } from "@/components/layout/navbar/global-search-config";
import { Button } from "@/components/ui/button";
import { useCurrentScope } from "@/hooks/useCurrentScope";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { useTranslations } from "next-intl";

type SearchPageProps = {
  initialQuery: string;
};

export function SearchPage({ initialQuery }: SearchPageProps) {
  const t = useTranslations("globalSearch");
  const scope = useCurrentScope();
  const query = initialQuery.trim();
  const { data, isFetching, error, refetch } = useGlobalSearch({
    query,
    restaurantId: scope.restaurantId,
    branchId: scope.isBranchAdmin ? scope.branchId : undefined,
    enabled: query.length >= 2,
    limit: 10,
  });

  const hasResults = data?.groups.some((group) => group.results.length > 0) ?? false;

  return (
    <Container>
      <PageHeader
        title={t("resultsTitle")}
        description={query ? t("showingResults", { query }) : t("resultsDescription")}
      />

      <SectionCard>
        {query.length < 2 ? (
          <StatePanel
            state="unavailable"
            title={t("minimumTitle")}
            description={t("minimumCharacters")}
          />
        ) : null}

        {query.length >= 2 && isFetching && !data ? (
          <StatePanel
            state="loading"
            title={t("searching")}
            description={t("searchingDescription")}
          />
        ) : null}

        {query.length >= 2 && error ? (
          <StatePanel
            state="error"
            title={t("temporaryUnavailable")}
            description={t("temporaryUnavailableWithPeriod")}
            action={
              <Button type="button" variant="outline" onClick={() => refetch()}>
                {t("retry")}
              </Button>
            }
          />
        ) : null}

        {query.length >= 2 && !isFetching && !error && !hasResults ? (
          <StatePanel
            state="empty"
            title={t("noResults")}
            description={t("noResultsDescription", { query })}
          />
        ) : null}

        {query.length >= 2 && !error && hasResults ? (
          <div className="space-y-6">
            {data?.groups
              .filter((group) => group.results.length > 0)
              .map((group) => (
                <section key={group.entity} className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-base font-semibold text-[var(--ui-text)]">
                      {t(`groups.${group.entity}`)}
                    </h2>
                    <Button asChild size="sm" variant="ghost">
                      <Link
                        href={buildSearchHref(
                          group.href.split("?")[0] || group.href,
                          query,
                        )}
                      >
                        {t("viewAll")}
                      </Link>
                    </Button>
                  </div>

                  <div className="divide-y divide-[var(--ui-border)] overflow-hidden rounded-[var(--ui-radius-card)] border border-[var(--ui-border)]">
                    {group.results.slice(0, 10).map((result) => (
                      <Link
                        key={`${result.entity}-${result.id}`}
                        href={result.href}
                        className="flex min-w-0 items-start gap-3 px-4 py-3 transition-colors hover:bg-[var(--ui-surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                      >
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--ui-brand-soft)] text-sm font-semibold text-primary">
                          {result.title.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 items-center gap-2">
                            <p className="truncate text-sm font-medium text-[var(--ui-text)]">
                              {result.title}
                            </p>
                            {result.status ? (
                              <StatusBadge size="sm">{result.status}</StatusBadge>
                            ) : null}
                          </div>
                          {result.subtitle ? (
                            <p className="truncate text-xs text-[var(--ui-text-muted)]">
                              {result.subtitle}
                            </p>
                          ) : null}
                          {result.description ? (
                            <p className="truncate text-xs text-[var(--ui-text-subtle)]">
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
      </SectionCard>
    </Container>
  );
}
