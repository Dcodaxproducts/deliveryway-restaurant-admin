import { getRequestLocale } from "@/config/i18n";
import deMessages from "@/messages/de.json";
import enMessages from "@/messages/en.json";

export type LocalizedMessageKey = keyof typeof deMessages.localizedUi;

export const getLocalizedMessage = (key: LocalizedMessageKey) => {
  const messages = getRequestLocale() === "en" ? enMessages.localizedUi : deMessages.localizedUi;
  return messages[key] ?? enMessages.localizedUi[key] ?? key;
};
