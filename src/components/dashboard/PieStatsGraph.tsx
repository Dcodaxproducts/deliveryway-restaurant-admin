"use client";

import { Card } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

const data = [
  {
    label: "Total Order",
    value: 81,
    color: "#CE181B",
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
  return (
   <Card className="p-[24px] border-none shadow-none rounded-[16px] bg-white h-full ">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-medium text-dark">Pie Chart</h3>

        <div className="flex items-center gap-6 text-sm text-gray-500">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded" />
            Chart
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked readOnly className="accent-red-500" />
            Show Value
          </label>
        </div>
      </div>

      {/* Donuts */}
      <div className="grid grid-cols-3 gap-6">
        {data.map((item) => (
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
