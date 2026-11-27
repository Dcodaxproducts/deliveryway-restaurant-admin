import { getLocalizedMessage } from "@/lib/localized-message";
import { z } from "zod";

export const orderStatusUpdateSchema = z.object({
  status: z.string().trim().min(1, getLocalizedMessage("validation116")),
  deliveryOtp: z.string().trim().optional(),
  deliveryFulfillmentMode: z.enum(["EXTERNAL"]).optional(),
});

export type OrderStatusUpdateValues = z.infer<typeof orderStatusUpdateSchema>;
