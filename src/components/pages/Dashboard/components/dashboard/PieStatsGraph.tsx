"use client";

import { Card } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { useTranslations } from "next-intl";

const data = [
  {
    label: "Total Order",
    value: 81,
    color: "var(--brand-primary)",
    bg: "#FDECEC",
  },
  {
    label: "Customer Growth",
    value: 22,
    color: "#16A34A",
    bg: "#DCFCE7",
  },
  {
    label: "Total Revenue",
    value: 62,
    color: "#6366F1",
    bg: "#E0E7FF",
  },
];

const PieStatsGraph = () => {
  const t = useTranslations("dashboard");
  const translatedData = data.map((item) => ({
    ...item,
    label:
      item.label === "Total Order"
        ? t("totalOrder")
        : item.label === "Customer Growth"
          ? t("customerGrowth")
          : t("totalRevenue"),
  }));

  return (
   <Card className="h-full min-w-0 overflow-hidden rounded-[16px] border-none bg-white p-[24px] shadow-none">

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-medium text-dark">{t("pieChart")}</h3>

        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded" />
            {t("chart")}
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked readOnly className="accent-primary" />
            {t("showValue")}
          </label>
        </div>
      </div>

      {/* Donuts */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {translatedData.map((item) => (
          <div key={item.label} className="flex flex-col items-center">
            <div className="relative size-[110px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[{ value: item.value }, { value: 100 - item.value }]}
                    innerRadius={38}
                    outerRadius={50}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    <Cell fill={item.color} />
                    <Cell fill={item.bg} />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              <div className="absolute inset-0 flex items-center justify-center text-lg font-semibold text-dark">
                {item.value}%
              </div>
            </div>

            <p className="mt-3 text-sm text-dark font-medium text-center">
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default PieStatsGraph;
