import { describe, expect, it } from "vitest";

import { resolvePosCheckoutErrorMessage } from "@/components/pages/Pos/components/pos/pos-checkout-errors";
import de from "@/messages/de.json";
import en from "@/messages/en.json";

const translator = (messages: { pos: unknown }) => (key: string) => {
  const value = key.split(".").reduce<unknown>((current, segment) => {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return undefined;
    }
    return (current as Record<string, unknown>)[segment];
  }, messages.pos);

  return typeof value === "string" ? value : key;
};

describe("resolvePosCheckoutErrorMessage", () => {
  it("maps the stable guest-contact API code in English and German", () => {
    const response = {
      error: {
        code: "GUEST_CONTACT_REQUIRED",
        message: "Guest contact details are required to place this order.",
      },
    };

    expect(
      resolvePosCheckoutErrorMessage(response, translator(en), "fallback"),
    ).toBe(translator(en)("toast.guestContactRequired"));
    expect(
      resolvePosCheckoutErrorMessage(response, translator(de), "fallback"),
    ).toBe(translator(de)("toast.guestContactRequired"));
  });

  it("maps the legacy raw DTO message without displaying the field name", () => {
    const response = {
      response: {
        data: {
          error: {
            message: "guestContact is required for guest orders",
          },
        },
      },
    };

    const message = resolvePosCheckoutErrorMessage(
      response,
      translator(de),
      "fallback",
    );
    expect(message).toBe(translator(de)("toast.guestContactRequired"));
    expect(message).not.toContain("guestContact");
  });

  it("does not expose unrelated raw API messages", () => {
    expect(
      resolvePosCheckoutErrorMessage(
        { error: { message: "Specific API explanation" } },
        translator(en),
        "fallback",
      ),
    ).toBe("fallback");
  });
});
