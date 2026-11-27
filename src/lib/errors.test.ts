import { describe, expect, it } from "vitest";

import { getApiErrorMessage } from "@/lib/errors";

describe("getApiErrorMessage", () => {
  it("does not expose raw backend validation messages", () => {
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
      "Something went wrong.",
    );
  });
});
