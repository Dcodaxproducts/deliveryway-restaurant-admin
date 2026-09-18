import { describe, expect, it } from "vitest";

import de from "@/messages/de.json";
import en from "@/messages/en.json";

const orderTypeMessageKeys = [
  "orderTypeScope",
  "validForOrderType",
  "allOrderTypes",
  "deliveryOnly",
  "pickupOnly",
  "dineInOnly",
  "orderTypeScopeHelp",
] as const;

describe("promotion form messages", () => {
  it.each([
    ["English", en],
    ["German", de],
  ])("provides the shared order-type messages in %s", (_locale, messages) => {
    orderTypeMessageKeys.forEach((key) => {
      expect(messages.promotions.forms[key]).toBeTruthy();
    });
  });
});
