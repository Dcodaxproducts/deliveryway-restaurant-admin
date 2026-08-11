import { describe, expect, it } from "vitest";

import {
  mapPlaceToAddressFields,
  selectBestGeocodeResult,
} from "@/components/pages/Branches/components/BranchLocationPicker";

describe("mapPlaceToAddressFields", () => {
  it("separates Google street_number into shopNumber and keeps street as route", () => {
    const fields = mapPlaceToAddressFields(
      {
        address_components: [
          { long_name: "7-9", short_name: "7-9", types: ["street_number"] },
          {
            long_name: "Katernberger Straße",
            short_name: "Katernberger Str.",
            types: ["route"],
          },
          { long_name: "45327", short_name: "45327", types: ["postal_code"] },
          { long_name: "Essen", short_name: "Essen", types: ["locality"] },
          {
            long_name: "Nordrhein-Westfalen",
            short_name: "NRW",
            types: ["administrative_area_level_1"],
          },
          { long_name: "Deutschland", short_name: "DE", types: ["country"] },
        ],
        formatted_address: "Katernberger Str. 7-9, 45327 Essen-Stadtbezirke VI, Deutschland",
      },
      { lat: 51.496504, lng: 7.048057 }
    );

    expect(fields.street).toBe("Katernberger Straße");
    expect(fields.shopNumber).toBe("7-9");
    expect(fields.postalCode).toBe("45327");
    expect(fields.city).toBe("Essen");
    expect(fields.state).toBe("Nordrhein-Westfalen");
    expect(fields.country).toBe("Deutschland");
    expect(fields.lat).toBe("51.496504");
    expect(fields.lng).toBe("7.048057");
  });

  it("strips the house number from formatted-address fallback when route is unavailable", () => {
    const fields = mapPlaceToAddressFields(
      {
        address_components: [
          { long_name: "40", short_name: "40", types: ["street_number"] },
        ],
        formatted_address: "Example Street 40, 10000 City",
      },
      { lat: 1, lng: 2 }
    );

    expect(fields.street).toBe("Example Street");
    expect(fields.shopNumber).toBe("40");
  });

  it("uses postal town and sublocality fallbacks for complete address autofill", () => {
    const fields = mapPlaceToAddressFields(
      {
        address_components: [
          { long_name: "12", short_name: "12", types: ["street_number"] },
          { long_name: "High Road", short_name: "High Rd", types: ["route"] },
          { long_name: "Wembley", short_name: "Wembley", types: ["postal_town"] },
          {
            long_name: "Alperton",
            short_name: "Alperton",
            types: ["sublocality_level_1"],
          },
          { long_name: "HA0 1AA", short_name: "HA0 1AA", types: ["postal_code"] },
        ],
      },
      { lat: 51.54, lng: -0.29 },
    );

    expect(fields.city).toBe("Wembley");
    expect(fields.area).toBe("Alperton");
    expect(fields.postalCode).toBe("HA0 1AA");
  });

  it("prefers a street-level reverse-geocode result over a plus-code result", () => {
    const plusCodeResult = {
      address_components: [
        { long_name: "Islamabad", short_name: "Islamabad", types: ["locality"] },
      ],
      formatted_address: "P2H5+GH Islamabad",
    };
    const streetResult = {
      address_components: [
        { long_name: "12", short_name: "12", types: ["street_number"] },
        { long_name: "Street 8", short_name: "Street 8", types: ["route"] },
        { long_name: "44000", short_name: "44000", types: ["postal_code"] },
      ],
      formatted_address: "Street 8, Islamabad",
    };

    expect(selectBestGeocodeResult([plusCodeResult, streetResult])).toBe(streetResult);
  });
});
