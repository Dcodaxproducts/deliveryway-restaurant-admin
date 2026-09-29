import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import MenuItemStatusControl from "./MenuItemStatusControl";
import {
  buildMenuItemStatusPayload,
  updateMenuItemStatus,
} from "./menu-item-status";

const item = {
  id: "item-1",
  restaurantId: "restaurant-1",
  categoryId: "category-1",
  name: "Soup",
  slug: "soup",
  pricingMode: "SINGLE",
  basePrice: 8.5,
  prepTimeMinutes: 10,
  isActive: true,
  sortOrder: 2,
};

describe("menu item status toggle", () => {
  it("sends the full edit payload and resolves the new status on success", async () => {
    const update = vi.fn().mockResolvedValue({ success: true });

    const result = await updateMenuItemStatus({
      item,
      restaurantId: "restaurant-1",
      isActive: false,
      update,
    });

    expect(update).toHaveBeenCalledOnce();
    expect(update).toHaveBeenCalledWith(
      "item-1",
      expect.objectContaining({
        categoryId: "category-1",
        name: "Soup",
        slug: "soup",
        basePrice: 8.5,
        prepTimeMinutes: 10,
        isActive: false,
      }),
    );
    expect(result.isActive).toBe(false);
  });

  it("rejects on failure so the caller can keep the previous status", async () => {
    const error = new Error("Update failed");
    const update = vi.fn().mockRejectedValue(error);

    await expect(
      updateMenuItemStatus({
        item,
        restaurantId: "restaurant-1",
        isActive: false,
        update,
      }),
    ).rejects.toBe(error);
    expect(item.isActive).toBe(true);
  });

  it("preserves the payload contract while changing only status intent", () => {
    const payload = buildMenuItemStatusPayload({
      item,
      restaurantId: "restaurant-1",
      isActive: false,
    });

    expect(payload).not.toHaveProperty("restaurantId");
    expect(payload).toMatchObject({
      name: "Soup",
      categoryId: "category-1",
      pricingMode: "SINGLE",
      isActive: false,
    });
  });

  it("renders active and inactive status labels", () => {
    const activeMarkup = renderToStaticMarkup(
      <MenuItemStatusControl
        active
        pending={false}
        disabled={false}
        activeLabel="Active"
        inactiveLabel="Inactive"
        ariaLabel="Set Soup inactive"
        pendingLabel="Updating Soup"
        onCheckedChange={() => undefined}
      />,
    );
    const inactiveMarkup = renderToStaticMarkup(
      <MenuItemStatusControl
        active={false}
        pending={false}
        disabled={false}
        activeLabel="Active"
        inactiveLabel="Inactive"
        ariaLabel="Set Soup active"
        pendingLabel="Updating Soup"
        onCheckedChange={() => undefined}
      />,
    );

    expect(activeMarkup).toContain("Active");
    expect(activeMarkup).toContain('data-state="checked"');
    expect(inactiveMarkup).toContain("Inactive");
    expect(inactiveMarkup).toContain('data-state="unchecked"');
  });

  it("disables the switch and exposes progress while pending", () => {
    const markup = renderToStaticMarkup(
      <MenuItemStatusControl
        active
        pending
        disabled={false}
        activeLabel="Active"
        inactiveLabel="Inactive"
        ariaLabel="Set Soup inactive"
        pendingLabel="Updating Soup"
        onCheckedChange={() => undefined}
      />,
    );

    expect(markup).toContain("disabled");
    expect(markup).toContain('aria-busy="true"');
    expect(markup).toContain("Updating Soup");
  });
});
