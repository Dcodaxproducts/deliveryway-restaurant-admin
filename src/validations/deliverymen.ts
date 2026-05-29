import { z } from "zod";

const phoneRegex = /^[0-9]{10,15}$/;

export const deliverymanSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().regex(phoneRegex, "Invalid phone number"),
  vehicleType: z.string().optional(),
  vehicleNumber: z.string().optional(),
  restaurantId: z.string().min(1, "Restaurant is required"),
  branchId: z.string().min(1, "Branch is required"),
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
  orderId: z.string().min(1, "Order ID is required"),
});

export type AssignOrderValues = z.infer<typeof assignOrderSchema>;
