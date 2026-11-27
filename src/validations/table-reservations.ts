import { getLocalizedMessage } from "@/lib/localized-message";
import { z } from "zod";

export const tableReservationStatusUpdateSchema = z.object({
  status: z.enum(["REQUESTED", "CONFIRMED", "SEATED", "COMPLETED", "CANCELLED"], {
    required_error: getLocalizedMessage("validation116"),
  }),
});

export type TableReservationStatusUpdateValues = z.infer<
  typeof tableReservationStatusUpdateSchema
>;
