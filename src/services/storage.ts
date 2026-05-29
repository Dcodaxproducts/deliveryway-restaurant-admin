import api from "@/lib/axios";

export const createPresignedUpload = async (payload: { fileName: string; contentType: string }) => {
  const { data } = await api.post("/storage/presigned-upload", payload);
  return data;
};
