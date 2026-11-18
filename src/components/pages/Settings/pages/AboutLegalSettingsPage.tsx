"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";

import AboutUsRoutePage from "./AboutUsPage";
import { LegalProfilePage } from "./LegalProfilePage";
import {
  getAdjacentSettingsTab,
  SETTINGS_TABS,
  type SettingsTab,
} from "./about-legal-settings-tabs";

export function AboutLegalSettingsPage() {
  const t = useTranslations("aboutLegalSettings");
  const [activeTab, setActiveTab] = useState<SettingsTab>("about");
  const tabRefs = useRef<Record<SettingsTab, HTMLButtonElement | null>>({
    about: null,
    legal: null,
  });

  const selectTab = (tab: SettingsTab) => {
    setActiveTab(tab);
    tabRefs.current[tab]?.focus();
  };

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    tab: SettingsTab,
  ) => {
    if (
      event.key !== "ArrowLeft" &&
      event.key !== "ArrowRight" &&
      event.key !== "Home" &&
      event.key !== "End"
    ) {
      return;
    }

    event.preventDefault();
    selectTab(getAdjacentSettingsTab(tab, event.key));
  };

  return (
    <div className="min-w-0">
      <div className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
        <div
          className="mx-auto flex max-w-[1440px] gap-2 overflow-x-auto"
          role="tablist"
          aria-label={t("tabsLabel")}
        >
          {SETTINGS_TABS.map((tab) => (
            <button
              key={tab}
              ref={(element) => {
                tabRefs.current[tab] = element;
              }}
              id={tab + "-settings-tab"}
              type="button"
              role="tab"
              tabIndex={activeTab === tab ? 0 : -1}
              aria-selected={activeTab === tab}
              aria-controls={tab + "-settings-panel"}
              onClick={() => setActiveTab(tab)}
              onKeyDown={(event) => handleTabKeyDown(event, tab)}
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
        aria-labelledby={activeTab + "-settings-tab"}
        tabIndex={0}
        className="min-w-0"
      >
        {activeTab === "about" ? <AboutUsRoutePage /> : <LegalProfilePage />}
      </div>
    </div>
  );
}
