import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@/lib/axios";
import { createRestaurantFaviconUpload } from "@/services/storage";

vi.mock("@/lib/axios", () => ({
  api: { post: vi.fn() },
}));

describe("restaurant favicon storage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requests a restaurant-scoped presigned upload", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { data: { key: "scoped" } } });

    await createRestaurantFaviconUpload("restaurant/1", {
      fileName: "favicon.webp",
      contentType: "image/webp",
      fileSize: 128,
    });

    expect(api.post).toHaveBeenCalledWith(
      "/restaurants/restaurant%2F1/branding/favicon/presigned-upload",
      {
        fileName: "favicon.webp",
        contentType: "image/webp",
        fileSize: 128,
      },
    );
  });
});
