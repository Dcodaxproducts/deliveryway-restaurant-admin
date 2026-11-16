"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import AboutUsRoutePage from "./AboutUsPage";
import { LegalProfilePage } from "./LegalProfilePage";

type SettingsTab = "about" | "legal";

export function AboutLegalSettingsPage() {
  const t = useTranslations("aboutLegalSettings");
  const [activeTab, setActiveTab] = useState<SettingsTab>("about");

  return (
    <div className="min-w-0">
      <div className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
        <div
          className="mx-auto flex max-w-[1440px] gap-2 overflow-x-auto"
          role="tablist"
          aria-label={t("tabsLabel")}
        >
          {(["about", "legal"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              aria-controls={tab + "-settings-panel"}
              onClick={() => setActiveTab(tab)}
              className={
                "min-h-11 shrink-0 rounded-full px-4 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary " +
                (activeTab === tab
                  ? "bg-primary text-white"
                  : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50")
              }
            >
              {t(tab)}
            </button>
          ))}
        </div>
      </div>

      <div
        id={activeTab + "-settings-panel"}
        role="tabpanel"
        className="min-w-0"
      >
        {activeTab === "about" ? <AboutUsRoutePage /> : <LegalProfilePage />}
      </div>
    </div>
  );
}
