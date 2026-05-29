import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createChatThread, getChatThread, getChatThreads, sendChatMessage } from "@/services/chat";

export const chatQueryKeys = {
  threads: ["chat", "threads"] as const,
  thread: (id?: string) => ["chat", "threads", id] as const,
};

export const useGetChatThreads = (enabled = true) => {
  return useQuery({
    queryKey: chatQueryKeys.threads,
    queryFn: getChatThreads,
    enabled,
  });
};

export const useGetChatThread = (id?: string) => {
  return useQuery({
    queryKey: chatQueryKeys.thread(id),
    queryFn: () => getChatThread(id as string),
    enabled: Boolean(id),
  });
};

export const useCreateChatThread = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createChatThread,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.threads });
    },
  });
};

export const useSendChatMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sendChatMessage,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.thread(variables.id) });
    },
  });
};
