"use client";

import { Check, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LANGUAGE_LABELS,
  SUPPORTED_LOCALES,
  type AppLocale,
} from "@/config/i18n";
import { useAppLocale } from "@/hooks/useAppLocale";

const SHORT_LABELS: Record<AppLocale, string> = {
  en: "EN",
  de: "DE",
};

export default function LanguageSelector() {
  const { locale, setLocale } = useAppLocale();
  const common = useTranslations("common");
  const navigation = useTranslations("navigation");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-label={navigation("changeLanguage")}
          className="h-10 rounded-xl border-primary/10 bg-primary/10 px-3 text-xs font-semibold text-primary shadow-none hover:bg-primary/20 lg:h-12"
        >
          {SHORT_LABELS[locale]}
          <ChevronDown size={14} />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-[160px] rounded-xl border border-gray-100 p-1 shadow-xl"
      >
        {SUPPORTED_LOCALES.map((option) => {
          const isSelected = option === locale;
          const translatedLabel =
            option === "en" ? common("english") : common("german");

          return (
            <DropdownMenuItem
              key={option}
              onClick={() => setLocale(option)}
              className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm"
            >
              <span>{translatedLabel || LANGUAGE_LABELS[option]}</span>
              {isSelected ? <Check size={15} className="text-primary" /> : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
