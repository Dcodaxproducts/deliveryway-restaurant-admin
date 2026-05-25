import { z } from "zod";

export const openingHourSchema = z.object({
  dayOfWeek: z.string(),
  isClosed: z.boolean(),
  openTime: z.string().optional(),
  closeTime: z.string().optional(),
  note: z.string().optional(),
  breakTimes: z.array(z.object({
    startTime: z.string(),
    endTime: z.string(),
    note: z.string().optional(),
  })).default([]),
});

export const openingHoursSchema = z.object({
  openingHours: z.array(openingHourSchema),
});

export type OpeningHoursFormValues = z.infer<typeof openingHoursSchema>;
