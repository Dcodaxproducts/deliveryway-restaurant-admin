"use client";

import { useTranslations } from "next-intl";

import type { LocalizedMessageKey } from "@/lib/localized-message";

interface LocalizedTextProps {
  messageKey: LocalizedMessageKey;
}

export function LocalizedText({ messageKey }: LocalizedTextProps) {
  const t = useTranslations("localizedUi");
  return <>{t(messageKey)}</>;
}
