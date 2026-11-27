"use client";


import { getLocalizedMessage } from "@/lib/localized-message";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getApiErrorMessage } from "@/lib/errors";
import {
  getContactSubmission,
  getContactSubmissions,
  replyToContactSubmission,
  updateContactSubmissionStatus,
} from "@/services/contact-submissions";
import type {
  ContactSubmissionReplyPayload,
  ContactSubmissionsParams,
  ContactSubmissionStatusPayload,
} from "@/types/contact-submissions";

export const contactSubmissionsQueryKeys = {
  all: ["contact-submissions"] as const,
  list: (params: ContactSubmissionsParams) =>
    [
      "contact-submissions",
      "list",
      params.page,
      params.limit,
      params.restaurantId,
      params.branchId,
      params.status,
      params.search,
    ] as const,
  detail: (id: string) => ["contact-submissions", "detail", id] as const,
};

export function useContactSubmissions(params: ContactSubmissionsParams) {
  return useQuery({
    queryKey: contactSubmissionsQueryKeys.list(params),
    queryFn: () => getContactSubmissions(params),
    enabled: Boolean(params.restaurantId),
    placeholderData: (previousData) => previousData,
  });
}

export function useContactSubmission(id?: string) {
  return useQuery({
    queryKey: contactSubmissionsQueryKeys.detail(id || ""),
    queryFn: () => getContactSubmission(id || ""),
    enabled: Boolean(id),
  });
}

export function useUpdateContactSubmissionStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ContactSubmissionStatusPayload;
    }) => updateContactSubmissionStatus(id, payload),
    onSuccess: (submission) => {
      queryClient.invalidateQueries({ queryKey: contactSubmissionsQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: contactSubmissionsQueryKeys.detail(submission.id),
      });
      toast.success(getLocalizedMessage("message077"));
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, getLocalizedMessage("notification143")));
    },
  });
}

export function useReplyToContactSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ContactSubmissionReplyPayload;
    }) => replyToContactSubmission(id, payload),
    onSuccess: (submission) => {
      queryClient.invalidateQueries({ queryKey: contactSubmissionsQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: contactSubmissionsQueryKeys.detail(submission.id),
      });
      toast.success(getLocalizedMessage("message313"));
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, getLocalizedMessage("notification133")));
    },
  });
}
