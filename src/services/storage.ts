import api from "@/lib/axios";

export const createPresignedUpload = async (payload: { fileName: string; contentType: string }) => {
  const { data } = await api.post("/storage/presigned-upload", payload);
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
