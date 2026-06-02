import { z } from "zod";

export const orderStatusUpdateSchema = z.object({
  status: z.string().trim().min(1, "Status is required"),
  deliveryOtp: z.string().trim().optional(),
});

export type OrderStatusUpdateValues = z.infer<typeof orderStatusUpdateSchema>;
