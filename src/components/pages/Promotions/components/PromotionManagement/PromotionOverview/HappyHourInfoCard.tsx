"use client";

import { Percent } from "lucide-react";

type HappyHourInfo = {
  id?: string;
  name?: string;
  title?: string;
  discountType?: string;
  discountValue?: number | string;
  startTime?: string;
  endTime?: string;
  daysOfWeek?: string[];
  category?: {
    name?: string;
  };
  foodCategory?: string;
  isActive?: boolean;
};

type Props = {
  happyHour?: HappyHourInfo | null;
  loading?: boolean;
};

const formatDiscount = (happyHour?: HappyHourInfo | null) => {
  if (!happyHour) return "No Happy Hour";

  const value = Number(happyHour.discountValue ?? 0);

  if (!value) return happyHour.name ?? happyHour.title ?? "Happy Hour";

  return `${value}% Off`;
};

const formatTime = (time?: string) => {
  if (!time) return "--";

  // handles "14:30", "14:30:00", or ISO date string
  const date = time.includes("T")
    ? new Date(time)
    : new Date(`1970-01-01T${time}`);

  if (Number.isNaN(date.getTime())) return time;

  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDiscountType = (type?: string) => {
  if (!type) return "N/A";

  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export default function HappyHourInfoCard({
  happyHour,
  loading = false,
}: Props) {
  const title = happyHour?.name ?? happyHour?.title ?? "Happy Hour";
  const category =
    happyHour?.category?.name ?? happyHour?.foodCategory ?? "All";

  return (
    <div className="bg-white border border-[#EDEFF2] rounded-xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
      <div className="w-10 h-10 rounded-full bg-[#F9F9F9] flex items-center justify-center flex-shrink-0">
        {loading ? (
          <div className="h-5 w-5 animate-pulse rounded-full bg-gray-200" />
        ) : (
          <Percent className="text-primary" size={18} />
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:gap-0 w-full">
        {loading ? (
          <>
            <div className="flex-1 space-y-2">
              <div className="h-7 w-40 rounded-md bg-gray-200 animate-pulse" />
              <div className="h-4 w-32 rounded-md bg-gray-200 animate-pulse" />
            </div>

            <div className="flex-1 mt-3 sm:mt-0 space-y-2">
              <div className="h-4 w-44 rounded-md bg-gray-200 animate-pulse" />
              <div className="h-4 w-32 rounded-md bg-gray-200 animate-pulse" />
            </div>
          </>
        ) : happyHour ? (
          <>
            <div className="flex-1 min-w-[120px]">
              <p className="text-2xl font-semibold">
                {formatDiscount(happyHour)}{" "}
                <span className="text-xs font-normal text-gray-400 block sm:inline">
                  ({title})
                </span>
              </p>

              <p className="text-sm text-gray-500 mt-1">
                {formatTime(happyHour.startTime)} -{" "}
                {formatTime(happyHour.endTime)}
              </p>
            </div>

            <div className="flex-1 min-w-[100px] mt-2 sm:mt-0 text-sm text-gray-500">
              <p>
                Discount Type:{" "}
                {formatDiscountType(happyHour.discountType)}
              </p>
              <p>Food Category: {category}</p>
            </div>
          </>
        ) : (
          <div className="flex-1">
            <p className="text-2xl font-semibold">No Active Happy Hour</p>
            <p className="text-sm text-gray-500 mt-1">
              Create a happy hour to show discount details here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}