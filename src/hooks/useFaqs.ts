import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  createFaq,
  getFaqList,
  getFaq,
  updateFaq,
  deleteFaq,
} from "@/services/settings/faqs/faqs.api";

/**
 * ==============================
 * FAQ HOOKS
 * ==============================
 */

export const useCreateFaq = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      restaurantId,
      payload,
    }: {
      restaurantId: string;
      payload: {
        question: string;
        category: string;
        answer: string;
        status: "DRAFT" | "PUBLISHED";
        visibility: "PUBLIC" | "PRIVATE";
      };
    }) => createFaq(restaurantId, payload),

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["faqs", variables.restaurantId],
      });
      toast.success("FAQ created successfully!");
    },

    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to create FAQ");
    },
  });
};

export const useGetFaqList = (
  restaurantId: string,
  params?: {
    page?: number;
    search?: string;
    category?: string;
    status?: "DRAFT" | "PUBLISHED";
    visibility?: "PUBLIC" | "PRIVATE";
  }
) => {
  return useQuery({
    queryKey: [
      "faqs",
      restaurantId,
      params?.page,
      params?.search,
      params?.category,
      params?.status,
      params?.visibility,
    ],
    queryFn: () => getFaqList(restaurantId, params),
    enabled: !!restaurantId,
  });
};

export const useGetFaq = (restaurantId: string, faqId: string) => {
  return useQuery({
    queryKey: ["faqs", restaurantId, faqId],
    queryFn: () => getFaq(restaurantId, faqId),
    enabled: !!restaurantId && !!faqId,
  });
};

export const useUpdateFaq = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      restaurantId,
      faqId,
      payload,
    }: {
      restaurantId: string;
      faqId: string;
      payload: Partial<{
        question: string;
        category: string;
        answer: string;
        status: "DRAFT" | "PUBLISHED";
        visibility: "PUBLIC" | "PRIVATE";
      }>;
    }) => updateFaq(restaurantId, faqId, payload),

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["faqs", variables.restaurantId],
      });
      queryClient.invalidateQueries({
        queryKey: ["faqs", variables.restaurantId, variables.faqId],
      });
      toast.success("FAQ updated successfully!");
    },

    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update FAQ");
    },
  });
};

export const useDeleteFaq = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      restaurantId,
      faqId,
    }: {
      restaurantId: string;
      faqId: string;
    }) => deleteFaq(restaurantId, faqId),

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["faqs", variables.restaurantId],
      });
      toast.success("FAQ deleted successfully!");
    },

    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to delete FAQ");
    },
  });
};