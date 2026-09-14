import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const readSource = (relativePath: string) =>
  readFileSync(new URL(relativePath, import.meta.url), "utf8");

describe("compact dialog presentation", () => {
  it("keeps shared dialogs and confirmations restrained", () => {
    const dialog = readSource("../ui/dialog.tsx");
    const alertDialog = readSource("../ui/alert-dialog.tsx");

    expect(dialog).toContain("max-h-[calc(100dvh-2rem)]");
    expect(dialog).toContain("max-w-md");
    expect(dialog).toContain("text-xl font-semibold leading-7");
    expect(dialog).toContain("text-sm leading-5");
    expect(dialog).not.toContain("text-[32px]");

    expect(alertDialog).toContain("sm:max-w-[420px]");
    expect(alertDialog).toContain("size-12");
    expect(alertDialog).not.toContain("sm:max-w-lg");
  });

  it("caps large operational dialogs without changing their workflows", () => {
    const menuItem = readSource(
      "../pages/Menu/legacy/items/CreateMenuItemModalLegacy/CreateMenuItemModal.tsx",
    );
    const modifierManager = readSource(
      "../pages/Menu/modifier-groups/components/ManageGroupModifiersDialog.tsx",
    );
    const assignment = readSource(
      "../pages/Deliverymen/components/deliveryman/AssignOrderModal.tsx",
    );

    expect(menuItem).toContain("max-w-[960px]");
    expect(menuItem).toContain("max-h-[90dvh]");
    expect(menuItem).not.toContain("max-w-[1180px]");
    expect(modifierManager).toContain("max-w-[960px]");
    expect(assignment).toContain("max-w-[1080px]");
    expect(assignment).not.toContain("max-w-[1500px]");
  });
});
