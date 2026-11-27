import { describe, expect, it, vi } from "vitest";

import { clearAssetUpload, finalizeAssetUpload } from "./file-uploader-state";

describe("branding file uploader preview state", () => {
  it("persists the canonical URL while retaining the local preview after upload", () => {
    const persistValue = vi.fn();
    const discardPreview = vi.fn();

    expect(
      finalizeAssetUpload(
        "https://deliveryway.s3.eu-west-2.amazonaws.com/uploads/favicon.ico",
        persistValue,
        discardPreview,
      ),
    ).toBe(true);
    expect(persistValue).toHaveBeenCalledWith(
      "https://deliveryway.s3.eu-west-2.amazonaws.com/uploads/favicon.ico",
    );
    expect(discardPreview).not.toHaveBeenCalled();
  });

  it("discards the local preview when an upload does not return a URL", () => {
    const persistValue = vi.fn();
    const discardPreview = vi.fn();

    expect(finalizeAssetUpload(undefined, persistValue, discardPreview)).toBe(
      false,
    );
    expect(discardPreview).toHaveBeenCalledOnce();
    expect(persistValue).not.toHaveBeenCalled();
  });

  it("clears both the local preview and persisted asset value", () => {
    const persistValue = vi.fn();
    const discardPreview = vi.fn();

    clearAssetUpload(persistValue, discardPreview);

    expect(discardPreview).toHaveBeenCalledOnce();
    expect(persistValue).toHaveBeenCalledWith("");
  });
});
