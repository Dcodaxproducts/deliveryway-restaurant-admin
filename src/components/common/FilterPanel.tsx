"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

import ExportSection from "@/components/common/ExportSection";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function FilterPanel({ type }: { type?: string }) {
  const t = useTranslations("common");
  const searchId = `${type ?? "default"}-search`;
  const statusId = `${type ?? "default"}-status`;
  const businessModelId = `${type ?? "default"}-business-model`;

  return (
    <div className="space-y-[30px] rounded-[14px] border-[#F3F4F6] bg-white p-4 lg:border-2 lg:p-[24px]">
      <div className="flex flex-col gap-[20px] md:flex-row md:flex-wrap md:items-end">
        <div className="min-w-[280px] flex-1 space-y-[6px]">
          <Label htmlFor={searchId}>{t("search")}</Label>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <Input
              id={searchId}
              placeholder={t("searchPlaceholder")}
              className="border-[#BBBBBB] pl-10 focus-visible:ring-primary"
            />
          </div>
        </div>

        <div className="w-full space-y-[6px] md:w-[200px]">
          <Label htmlFor={statusId}>{t("status")}</Label>
          <Select>
            <SelectTrigger id={statusId}>
              <SelectValue placeholder={t("selectStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">{t("active")}</SelectItem>
              <SelectItem value="disabled">{t("disabled")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {type === "restaurant" ? (
          <div className="w-full space-y-[6px] md:w-[220px]">
            <Label htmlFor={businessModelId}>{t("businessModel")}</Label>
            <Select>
              <SelectTrigger id={businessModelId}>
                <SelectValue placeholder={t("selectModel")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="commission">{t("commission")}</SelectItem>
                <SelectItem value="subscription">{t("subscription")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>

      {type !== "restaurant" ? (
        <div>
          <ExportSection />
        </div>
      ) : null}
    </div>
  );
}
