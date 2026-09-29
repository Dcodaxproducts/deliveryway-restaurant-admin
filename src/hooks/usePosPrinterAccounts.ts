"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { posPrinterApi, type CreatePosPrinterAccountPayload } from "@/services/pos-printer";

export const posPrinterAccountKeys = { all: ["pos-printer-accounts"] as const };

export const usePosPrinterAccounts = (enabled = true) => useQuery({
  queryKey: posPrinterAccountKeys.all,
  queryFn: posPrinterApi.list,
  enabled,
});

export const useCreatePosPrinterAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePosPrinterAccountPayload) => posPrinterApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: posPrinterAccountKeys.all }),
  });
};

export const useUpdatePosPrinterStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => posPrinterApi.updateStatus(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: posPrinterAccountKeys.all }),
  });
};

export const useResetPosPrinterPassword = () => useMutation({
  mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) => posPrinterApi.resetPassword(id, newPassword),
});
