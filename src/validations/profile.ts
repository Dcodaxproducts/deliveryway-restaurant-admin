import { getLocalizedMessage } from "@/lib/localized-message";
import { z } from "zod";

export const profileSchema = z.object({
  firstName: z.string().trim().min(1, getLocalizedMessage("validation039")),
  lastName: z.string().trim().min(1, getLocalizedMessage("validation060")),
  avatarUrl: z.string().optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
