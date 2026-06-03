"use client";

import { useContext } from "react";

import { I18nContext } from "@/components/providers/i18n-provider";

export const useAppLocale = () => {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useAppLocale must be used within I18nProvider");
  }

  return context;
};
