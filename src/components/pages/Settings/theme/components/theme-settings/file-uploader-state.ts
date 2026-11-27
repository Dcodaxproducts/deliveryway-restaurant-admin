type PersistAssetValue = (value: string) => void;

export function finalizeAssetUpload(
  fileUrl: string | null | undefined,
  persistValue: PersistAssetValue,
  discardPreview: () => void,
) {
  if (!fileUrl) {
    discardPreview();
    return false;
  }

  persistValue(fileUrl);
  return true;
}

export function clearAssetUpload(
  persistValue: PersistAssetValue,
  discardPreview: () => void,
) {
  discardPreview();
  persistValue("");
}
