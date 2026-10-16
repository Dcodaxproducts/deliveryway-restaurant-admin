"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Clock3, Send, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SectionCard } from "@/components/common/SectionCard";
import { StatePanel } from "@/components/common/EmptyState";
import {
  useAnalyticsCapabilities,
  useAnalyticsCopilotQuery,
} from "@/hooks/useAnalyticsCopilot";
import type {
  AnalyticsCopilotResponse,
  AnalyticsIntent,
  AnalyticsMetric,
  AnalyticsPeriod,
  AnalyticsQueryInput,
} from "@/services/analytics-copilot";

const INTENTS: AnalyticsIntent[] = [
  "OVERVIEW",
  "REVENUE",
  "BUSY_HOURS",
  "CANCELLATIONS",
  "PAYMENT_TYPES",
  "POPULAR_ITEMS",
  "STAFF_PERFORMANCE",
];

const formatMetric = (
  metric: AnalyticsMetric,
  currency: string,
  locale: string,
) => {
  if (metric.unit === "currency")
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(metric.value);
  if (metric.unit === "percent")
    return new Intl.NumberFormat(locale, {
      style: "percent",
      maximumFractionDigits: 1,
    }).format(metric.value / 100);
  if (metric.unit === "hour")
    return String(metric.value).padStart(2, "0") + ":00";
  return new Intl.NumberFormat(locale).format(metric.value);
};

export function AnalyticsCopilotResult({
  result,
}: {
  result: AnalyticsCopilotResponse;
}) {
  const t = useTranslations("reports.analyticsCopilot");
  const locale = useLocale();
  return (
    <div className="space-y-5" aria-live="polite">
      {result.mode === "DETERMINISTIC_FALLBACK" ? (
        <div
          role="status"
          className="rounded-[var(--ui-radius-control)] border border-[var(--ui-warning)]/30 bg-[var(--ui-warning-soft)] px-4 py-3 text-sm text-[var(--ui-text)]"
        >
          <strong>{t("fallbackTitle")}</strong> {t("fallbackDescription")}
        </div>
      ) : null}
      <article className="rounded-[var(--ui-radius-card)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-[var(--ui-radius-control)] bg-[var(--ui-brand-soft)] text-primary">
            <Sparkles aria-hidden="true" size={18} />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-[var(--ui-text)]">
              {t("answerTitle")}
            </h3>
            <p className="mt-1 text-sm leading-6 text-[var(--ui-text-muted)]">
              {result.answer.summary}
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {result.answer.insights.map((insight) => (
            <div
              key={insight.title + insight.evidenceMetricIds.join("-")}
              className="rounded-[var(--ui-radius-control)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-3.5"
            >
              <h4 className="text-sm font-semibold">{insight.title}</h4>
              <p className="mt-1 text-sm leading-5 text-[var(--ui-text-muted)]">
                {insight.detail}
              </p>
            </div>
          ))}
        </div>
      </article>

      <section aria-labelledby="copilot-evidence-title">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3
            id="copilot-evidence-title"
            className="flex items-center gap-2 text-sm font-semibold"
          >
            <TrendingUp aria-hidden="true" size={17} />
            {t("evidenceTitle")}
          </h3>
          <span className="text-xs text-[var(--ui-text-muted)]">
            {result.period.fromDate} – {result.period.toDate}
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {result.evidence.metrics.map((metric) => (
            <div
              key={metric.id}
              className="rounded-[var(--ui-radius-control)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-3.5"
            >
              <p className="text-xs font-medium text-[var(--ui-text-muted)]">
                {t("metricLabels." + metric.id)}
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {formatMetric(metric, result.currency, locale)}
              </p>
              {typeof metric.changePercent === "number" ? (
                <p className="mt-1 text-xs text-[var(--ui-text-muted)]">
                  {t("versusPrevious", { value: metric.changePercent })}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <EvidenceList
          title={t("paymentTypes")}
          empty={t("noEvidence")}
          items={result.evidence.paymentTypes
            .slice(0, 5)
            .map((payment) => payment.paymentMethod + " · " + payment.count)}
        />
        <EvidenceList
          title={t("popularItems")}
          empty={t("noEvidence")}
          items={result.evidence.popularItems
            .slice(0, 5)
            .map((item) => item.name + " · " + item.quantity)}
        />
        <EvidenceList
          title={t("busyHours")}
          empty={t("noEvidence")}
          items={result.evidence.busyHours
            .slice()
            .sort((a, b) => b.orderCount - a.orderCount)
            .slice(0, 5)
            .map(
              (hour) =>
                String(hour.hour).padStart(2, "0") + ":00 · " + hour.orderCount,
            )}
        />
        <EvidenceList
          title={t("staffActivity")}
          empty={t("noEvidence")}
          items={result.evidence.staffPerformance
            .slice(0, 5)
            .map((staff) => staff.displayName + " · " + staff.activityCount)}
        />
      </div>

      <details className="rounded-[var(--ui-radius-control)] border border-[var(--ui-border)] px-4 py-3 text-sm">
        <summary className="cursor-pointer font-medium">
          {t("definitions")}
        </summary>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-[var(--ui-text-muted)]">
          {result.evidence.definitions.map((definition) => (
            <li key={definition}>{definition}</li>
          ))}
        </ul>
      </details>
      <p className="flex items-center gap-1.5 text-xs text-[var(--ui-text-muted)]">
        <Clock3 aria-hidden="true" size={14} />
        {t("generatedAt", {
          value: new Intl.DateTimeFormat(locale, {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(new Date(result.generatedAt)),
        })}
      </p>
    </div>
  );
}

function EvidenceList({
  title,
  items,
  empty,
}: {
  title: string;
  items: string[];
  empty: string;
}) {
  return (
    <section className="rounded-[var(--ui-radius-control)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-4">
      <h4 className="text-sm font-semibold">{title}</h4>
      {items.length ? (
        <ul className="mt-2 space-y-1.5 text-sm text-[var(--ui-text-muted)]">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-[var(--ui-text-muted)]">{empty}</p>
      )}
    </section>
  );
}

export function AnalyticsCopilot({
  restaurantId,
  branchId,
}: {
  restaurantId: string;
  branchId?: string;
}) {
  const t = useTranslations("reports.analyticsCopilot");
  const locale = useLocale();
  const scope = useMemo(
    () => ({ restaurantId, ...(branchId ? { branchId } : {}) }),
    [branchId, restaurantId],
  );
  const capabilities = useAnalyticsCapabilities(scope);
  const query = useAnalyticsCopilotQuery();
  const [intent, setIntent] = useState<AnalyticsIntent>("OVERVIEW");
  const [period, setPeriod] = useState<AnalyticsPeriod>("LAST_7_DAYS");
  const [question, setQuestion] = useState("");
  const lastInput = useRef<AnalyticsQueryInput | null>(null);

  const submit = (event?: FormEvent, retry = false) => {
    event?.preventDefault();
    if (query.isPending) return;
    if (retry && lastInput.current) {
      query.mutate(lastInput.current);
      return;
    }
    const normalized = question.trim();
    if (!normalized) return;
    const input: AnalyticsQueryInput = {
      ...scope,
      requestId: globalThis.crypto.randomUUID(),
      intent,
      period,
      comparison: "PREVIOUS_PERIOD",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      locale: locale === "de" ? "de" : "en",
      question: normalized,
    };
    lastInput.current = input;
    query.mutate(input);
  };

  return (
    <SectionCard
      title={
        <span className="flex items-center gap-2">
          <Sparkles aria-hidden="true" size={18} />
          {t("title")}
        </span>
      }
      description={t("description")}
      action={
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ui-brand-soft)] px-2.5 py-1 text-xs font-medium text-primary">
          <ShieldCheck aria-hidden="true" size={14} />
          {t("readOnly")}
        </span>
      }
    >
      {capabilities.isLoading ? (
        <StatePanel
          state="loading"
          compact
          title={t("loadingTitle")}
          description={t("loadingDescription")}
        />
      ) : capabilities.isError ? (
        <StatePanel
          state="error"
          compact
          title={t("loadErrorTitle")}
          description={t("loadErrorDescription")}
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => capabilities.refetch()}
            >
              {t("retry")}
            </Button>
          }
        />
      ) : !capabilities.data?.data.enabled ? (
        <StatePanel
          state="unavailable"
          compact
          title={t("disabledTitle")}
          description={t("disabledDescription")}
        />
      ) : (
        <div className="space-y-5">
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-medium">
                {t("intentLabel")}
                <select
                  value={intent}
                  onChange={(event) =>
                    setIntent(event.target.value as AnalyticsIntent)
                  }
                  className="h-11 rounded-[var(--ui-radius-control)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {INTENTS.map((value) => (
                    <option key={value} value={value}>
                      {t("intents." + value)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                {t("periodLabel")}
                <select
                  value={period}
                  onChange={(event) =>
                    setPeriod(event.target.value as AnalyticsPeriod)
                  }
                  className="h-11 rounded-[var(--ui-radius-control)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <option value="LAST_7_DAYS">
                    {t("periods.LAST_7_DAYS")}
                  </option>
                  <option value="LAST_30_DAYS">
                    {t("periods.LAST_30_DAYS")}
                  </option>
                </select>
              </label>
            </div>
            <label
              className="grid gap-1.5 text-sm font-medium"
              htmlFor="analytics-copilot-question"
            >
              {t("questionLabel")}
              <Textarea
                id="analytics-copilot-question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                maxLength={500}
                rows={3}
                placeholder={t("questionPlaceholder")}
                disabled={query.isPending}
              />
            </label>
            <div
              className="flex flex-wrap gap-2"
              aria-label={t("examplesLabel")}
            >
              {capabilities.data.data.examples.map((example, index) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setQuestion(t("examples." + index))}
                  className="min-h-10 rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-left text-xs text-[var(--ui-text-muted)] transition-colors hover:border-primary hover:text-[var(--ui-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {t("examples." + index)}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-[var(--ui-text-muted)]">
                {t("privacyNote")}
              </p>
              <Button
                type="submit"
                disabled={!question.trim() || query.isPending}
                className="min-h-11 shrink-0"
              >
                <Send aria-hidden="true" size={16} className="mr-2" />
                {query.isPending ? t("asking") : t("ask")}
              </Button>
            </div>
          </form>
          {query.isPending ? (
            <StatePanel
              state="loading"
              compact
              title={t("generatingTitle")}
              description={t("generatingDescription")}
            />
          ) : query.isError ? (
            <StatePanel
              state="error"
              compact
              title={t("queryErrorTitle")}
              description={t("queryErrorDescription")}
              action={
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => submit(undefined, true)}
                >
                  {t("retry")}
                </Button>
              }
            />
          ) : query.data?.data ? (
            <AnalyticsCopilotResult result={query.data.data} />
          ) : (
            <StatePanel
              state="empty"
              compact
              title={t("emptyTitle")}
              description={t("emptyDescription")}
            />
          )}
        </div>
      )}
    </SectionCard>
  );
}
