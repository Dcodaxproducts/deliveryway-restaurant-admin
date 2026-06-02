import { z } from "zod";

export const tableReservationStatusUpdateSchema = z.object({
  status: z.enum(["REQUESTED", "CONFIRMED", "SEATED", "COMPLETED", "CANCELLED"], {
    required_error: "Status is required",
  }),
});

export type TableReservationStatusUpdateValues = z.infer<
  typeof tableReservationStatusUpdateSchema
>;
