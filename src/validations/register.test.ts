import { describe, expect, it } from "vitest";

import { restaurantSchema } from "./register";

const restaurant = {
  name: "Pizza House",
  logoUrl: new File(["logo"], "logo.png", { type: "image/png" }),
  slug: "pizza-house",
  tagline: "Fresh pizza",
  supportContact: {
    email: "support@example.com",
    phone: "+491234567890",
    whatsapp: "",
  },
  branding: {
    primaryColor: "#111111",
    secondaryColor: "#ffffff",
    fontFamily: "Inter",
  },
};

describe("restaurantSchema", () => {
  it("accepts an empty optional WhatsApp number", () => {
    expect(restaurantSchema.safeParse(restaurant).success).toBe(true);
  });

  it("validates WhatsApp when supplied", () => {
    expect(
      restaurantSchema.safeParse({
        ...restaurant,
        supportContact: { ...restaurant.supportContact, whatsapp: "invalid" },
      }).success,
    ).toBe(false);
  });
});
