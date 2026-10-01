import { api } from "@/lib/axios";

export const MAX_UPLOAD_FILE_SIZE_MB = 20;
export const MAX_UPLOAD_FILE_SIZE_BYTES = MAX_UPLOAD_FILE_SIZE_MB * 1024 * 1024;

export const createPresignedUpload = async (payload: { fileName: string; contentType: string; fileSize: number }) => {
  const { data } = await api.post("/storage/presigned-upload", payload);
  return data;
};

export const finalizeImageUpload = async (payload: { key?: string; fileUrl?: string }) => {
  const { data } = await api.post("/storage/finalize-image", payload);
  return data;
};

export const getClientStorageItem = (key: string): string | null => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
};

export const setClientStorageItem = (key: string, value: string): void => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, value);
};

export const removeClientStorageItem = (key: string): void => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
};
