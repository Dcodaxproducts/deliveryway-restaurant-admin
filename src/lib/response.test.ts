import { describe, expect, it } from "vitest";

import { extractResponseItems, extractResponseMeta, unwrapEnvelope } from "./response";

describe("API response helpers", () => {
  it("unwraps { data } envelopes", () => {
    expect(unwrapEnvelope({ data: { id: "1" } })).toEqual({ id: "1" });
  });

  it("extracts array items from direct arrays", () => {
    expect(extractResponseItems([{ id: 1 }, { id: 2 }])).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it("extracts array items from nested data", () => {
    expect(extractResponseItems({ data: { items: [{ id: 1 }] } })).toEqual([{ id: 1 }]);
  });

  it("extracts meta from payload or nested data", () => {
    expect(extractResponseMeta({ meta: { page: 1, total: 3 } })).toEqual({ page: 1, total: 3 });
    expect(extractResponseMeta({ data: { meta: { page: 2, total: 5 } } })).toEqual({
      page: 2,
      total: 5,
    });
  });
});
