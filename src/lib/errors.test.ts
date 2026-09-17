import { describe, expect, it } from "vitest";

import { getApiErrorMessage } from "@/lib/errors";

describe("getApiErrorMessage", () => {
  it("returns the API validation message for actionable form feedback", () => {
    const error = {
      response: {
        data: {
          success: false,
          message: "property selectedMenuItems should not exist",
          error: {
            code: "VALIDATION_ERROR",
            message: "property selectedMenuItems should not exist",
          },
        },
      },
    };

    expect(getApiErrorMessage(error, "Something went wrong.")).toBe(
      "property selectedMenuItems should not exist",
    );
  });
});
