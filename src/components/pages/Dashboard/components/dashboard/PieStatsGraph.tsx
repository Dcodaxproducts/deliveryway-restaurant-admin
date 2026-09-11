"use client";

import { ChartPanel } from "@/components/common/ChartPanel";
import { StatePanel } from "@/components/common/EmptyState";
import { useTranslations } from "next-intl";

const PieStatsGraph = () => {
  const t = useTranslations("dashboard");

  // The dashboard API supplies totals, not percentage targets or growth comparisons.
  return (
    <ChartPanel title={t("pieChart")} className="h-full">
      <StatePanel
        state="unavailable"
        title={t("percentagesUnavailable")}
        description={t("percentagesUnavailableDescription")}
        compact
      />
    </ChartPanel>
  );
};

export default PieStatsGraph;
