import { describe, expect, it } from "vitest";

import {
  buildPosPrinterAccountCreateSchema,
  buildPosPrinterLoginEmail,
  getPosPrinterUsernameFromEmail,
  POS_PRINTER_ERROR_CODES,
  posPrinterLoginSchema,
  resolvePosPrinterLoginEmail,
  splitPosPrinterDisplayName,
} from "@/validations/pos-printer";

const issueCodes = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.success ? [] : (result.error?.issues ?? []).map((issue) => issue.message);

describe("POS printer account creation validation", () => {
  const schema = buildPosPrinterAccountCreateSchema({ requireBranch: true });
  const valid = {
    displayName: "  Kitchen   Printer ",
    username: " Kitchen-Printer.01 ",
    password: "CorrectHorseBattery1",
    branchId: "branch-1",
  };

  it("accepts the API contract and normalizes display name and username", () => {
    const result = schema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.displayName).toBe("Kitchen Printer");
      expect(result.data.username).toBe("kitchen-printer.01");
    }
  });

  it.each(["ab", "a".repeat(33)])("rejects username length %s", (username) => {
    expect(issueCodes(schema.safeParse({ ...valid, username }))).toContain(
      POS_PRINTER_ERROR_CODES.usernameLength
    );
  });

  it.each(["kitchen printer", "-kitchen", "küche", "printer@restaurant.com"])(
    "rejects username format %s",
    (username) => {
      expect(issueCodes(schema.safeParse({ ...valid, username }))).toContain(
        POS_PRINTER_ERROR_CODES.usernameFormat
      );
    }
  );

  it.each(["", "K", "x".repeat(101)])("rejects display name %s", (displayName) => {
    expect(issueCodes(schema.safeParse({ ...valid, displayName }))).toContain(
      POS_PRINTER_ERROR_CODES.displayNameLength
    );
  });

  it("requires at least 12 password characters", () => {
    expect(issueCodes(schema.safeParse({ ...valid, password: "short-pass" }))).toContain(
      POS_PRINTER_ERROR_CODES.passwordMin
    );
  });

  it("requires a branch only for business admins", () => {
    expect(issueCodes(schema.safeParse({ ...valid, branchId: "" }))).toContain(
      POS_PRINTER_ERROR_CODES.branchRequired
    );
    const scoped = buildPosPrinterAccountCreateSchema({ requireBranch: false });
    expect(scoped.safeParse({ ...valid, branchId: "" }).success).toBe(true);
  });
});

describe("POS printer login identifier validation", () => {
  it("accepts a username or an email in the same field", () => {
    expect(posPrinterLoginSchema.safeParse({ identifier: "kitchen-1", password: "x" }).success).toBe(true);
    expect(
      posPrinterLoginSchema.safeParse({ identifier: "printer@restaurant.com", password: "x" }).success
    ).toBe(true);
  });

  it("flags malformed emails but does not require an email", () => {
    expect(issueCodes(posPrinterLoginSchema.safeParse({ identifier: "printer@", password: "x" }))).toContain(
      POS_PRINTER_ERROR_CODES.identifierEmailInvalid
    );
    expect(issueCodes(posPrinterLoginSchema.safeParse({ identifier: "  ", password: "x" }))).toContain(
      POS_PRINTER_ERROR_CODES.identifierRequired
    );
    expect(issueCodes(posPrinterLoginSchema.safeParse({ identifier: "kitchen-1", password: "" }))).toContain(
      POS_PRINTER_ERROR_CODES.passwordRequired
    );
  });
});

describe("POS printer identifier mapping", () => {
  it("maps usernames to the API synthetic login alias and passes emails through", () => {
    expect(resolvePosPrinterLoginEmail(" Kitchen-1 ")).toBe("kitchen-1@pos-printer.feastflow.local");
    expect(resolvePosPrinterLoginEmail("Printer@Restaurant.com ")).toBe("printer@restaurant.com");
    expect(buildPosPrinterLoginEmail("bar")).toBe("bar@pos-printer.feastflow.local");
  });

  it("recovers the username from a synthetic alias only", () => {
    expect(getPosPrinterUsernameFromEmail("kitchen-1@pos-printer.feastflow.local")).toBe("kitchen-1");
    expect(getPosPrinterUsernameFromEmail("printer@restaurant.com")).toBeNull();
    expect(getPosPrinterUsernameFromEmail(undefined)).toBeNull();
  });

  it("derives legacy name fields the same way as the API fallback", () => {
    expect(splitPosPrinterDisplayName("Kitchen Printer Two")).toEqual({
      firstName: "Kitchen",
      lastName: "Printer Two",
    });
    expect(splitPosPrinterDisplayName("Bar")).toEqual({ firstName: "Bar", lastName: "Printer" });
  });
});
