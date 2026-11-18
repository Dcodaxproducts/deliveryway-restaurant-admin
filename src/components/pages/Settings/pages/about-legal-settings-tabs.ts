export type SettingsTab = "about" | "legal";

export const SETTINGS_TABS: SettingsTab[] = ["about", "legal"];

export const getAdjacentSettingsTab = (
  currentTab: SettingsTab,
  key: "ArrowLeft" | "ArrowRight" | "Home" | "End",
) => {
  if (key === "Home") return SETTINGS_TABS[0];
  if (key === "End") return SETTINGS_TABS[SETTINGS_TABS.length - 1];

  const currentIndex = SETTINGS_TABS.indexOf(currentTab);
  const offset = key === "ArrowRight" ? 1 : -1;
  return SETTINGS_TABS[
    (currentIndex + offset + SETTINGS_TABS.length) % SETTINGS_TABS.length
  ];
};
