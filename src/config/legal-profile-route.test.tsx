import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/pages/Settings/pages/LegalProfilePage", () => ({
  LegalProfilePage: () => null,
}));

import LegalProfileRoute from "@/app/(dashboard)/legal-profile/page";
import { LegalProfilePage } from "@/components/pages/Settings/pages/LegalProfilePage";

describe("legal profile route", () => {
  it("renders the restaurant legal profile instead of redirecting", () => {
    expect(LegalProfileRoute().type).toBe(LegalProfilePage);
  });
});
