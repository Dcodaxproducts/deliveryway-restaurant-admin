import { describe, expect, it } from "vitest";

import {
  buildPosPrinterAccountCreateSchema,
  normalizePosPrinterIdentifier,
  POS_PRINTER_ERROR_CODES,
  posPrinterLoginSchema,
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
      expect(result.data).toEqual({
        displayName: "Kitchen Printer",
        username: "kitchen-printer.01",
        password: "CorrectHorseBattery1",
        branchId: "branch-1",
      });
    }
  });

  it("only knows the CreatePosPrinterAccountDto fields", () => {
    expect(Object.keys(schema.shape).sort()).toEqual(["branchId", "displayName", "password", "username"]);
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
  it("accepts a username or an email in the same field and normalizes it", () => {
    const username = posPrinterLoginSchema.safeParse({ identifier: " Kitchen-1 ", password: "x" });
    expect(username.success).toBe(true);
    if (username.success) expect(username.data).toEqual({ identifier: "kitchen-1", password: "x" });

    const email = posPrinterLoginSchema.safeParse({ identifier: "Printer@Restaurant.com", password: "x" });
    expect(email.success).toBe(true);
    if (email.success) expect(email.data.identifier).toBe("printer@restaurant.com");
  });

  it("only knows the PosPrinterLoginDto fields", () => {
    expect(Object.keys(posPrinterLoginSchema.shape).sort()).toEqual(["identifier", "password"]);
  });

  it("flags malformed emails but does not require an email", () => {
    expect(issueCodes(posPrinterLoginSchema.safeParse({ identifier: "printer@", password: "x" }))).toContain(
      POS_PRINTER_ERROR_CODES.identifierEmailInvalid
    );
    expect(issueCodes(posPrinterLoginSchema.safeParse({ identifier: "  ", password: "x" }))).toContain(
      POS_PRINTER_ERROR_CODES.identifierRequired
    );
    expect(issueCodes(posPrinterLoginSchema.safeParse({ identifier: "ab", password: "x" }))).toContain(
      POS_PRINTER_ERROR_CODES.identifierRequired
    );
    expect(issueCodes(posPrinterLoginSchema.safeParse({ identifier: "kitchen-1", password: "" }))).toContain(
      POS_PRINTER_ERROR_CODES.passwordRequired
    );
  });

  it("never rewrites identifiers into synthetic email aliases", () => {
    expect(normalizePosPrinterIdentifier(" Kitchen-1 ")).toBe("kitchen-1");
    expect(normalizePosPrinterIdentifier("Legacy@Example.com")).toBe("legacy@example.com");
    expect(normalizePosPrinterIdentifier("kitchen-1")).not.toContain("@");
  });
});
