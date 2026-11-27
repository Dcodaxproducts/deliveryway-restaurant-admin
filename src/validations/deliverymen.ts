import { getLocalizedMessage } from "@/lib/localized-message";
import { z } from "zod";

const phoneRegex = /^[0-9]{10,15}$/;

export const deliverymanSchema = z.object({
  firstName: z.string().min(1, getLocalizedMessage("validation039")),
  lastName: z.string().min(1, getLocalizedMessage("validation060")),
  email: z.string().email(getLocalizedMessage("validation048")).optional().or(z.literal("")),
  phone: z.string().regex(phoneRegex, getLocalizedMessage("validation052")),
  vehicleType: z.string().optional(),
  vehicleNumber: z.string().optional(),
  restaurantId: z.string().min(1, getLocalizedMessage("validation097")),
  branchId: z.string().min(1, getLocalizedMessage("validation014")),
  status: z.enum(["AVAILABLE", "OFFLINE", "BUSY", "INACTIVE"]),
});

export type DeliverymanValues = z.infer<typeof deliverymanSchema>;

export type DeliverymanFormValues = Omit<DeliverymanValues, "restaurantId" | "branchId"> & {
  branchId: string;
};

export const updateDeliverymanSchema = deliverymanSchema.partial();

export type UpdateDeliverymanValues = z.infer<typeof updateDeliverymanSchema>;

export const deliverymanStatusSchema = z.object({
  status: z.enum(["AVAILABLE", "OFFLINE", "BUSY", "INACTIVE"]),
});

export type DeliverymanStatusValues = z.infer<typeof deliverymanStatusSchema>;

export const assignOrderSchema = z.object({
  orderId: z.string().min(1, getLocalizedMessage("validation075")),
});

export type AssignOrderValues = z.infer<typeof assignOrderSchema>;
