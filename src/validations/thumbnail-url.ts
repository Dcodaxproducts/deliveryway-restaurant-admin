import { z } from "zod";

const isValidThumbnailUrl = (value: string) => {
  const trimmedValue = value.trim();
  if (!trimmedValue) return true;
  if (trimmedValue.startsWith("/")) return true;

  try {
    const url = new URL(trimmedValue);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export const thumbnailUrlSchema = z
  .string()
  .refine(isValidThumbnailUrl, {
    message: "Thumbnail URL must be a valid http(s) URL or relative path.",
  });

export const getOptionalThumbnailUrl = (value?: string | null) => {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : undefined;
};
