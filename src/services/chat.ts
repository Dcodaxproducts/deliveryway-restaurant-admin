import api from "@/lib/axios";

export const getChatThreads = async () => {
  const { data } = await api.get("/chat/threads");
  return data;
};

export const createChatThread = async (payload: {
  message: string;
  orderId?: string;
  subject?: string;
}) => {
  const { data } = await api.post("/chat/threads", payload);
  return data;
};

export const getChatThread = async (id: string) => {
  const { data } = await api.get(`/chat/threads/${id}`);
  return data;
};

export const sendChatMessage = async ({ id, message }: { id: string; message: string }) => {
  const { data } = await api.post(`/chat/threads/${id}/messages`, { message });
  return data;
};
