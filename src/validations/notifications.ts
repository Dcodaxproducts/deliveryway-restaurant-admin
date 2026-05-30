import { z } from "zod";

export const notificationChannelSchema = z.object({
  email: z.boolean(),
  sms: z.boolean(),
  whatsapp: z.boolean(),
});

export const notificationSettingsSchema = z.object({
  emailAddress: z.string(),
  phoneNumber: z.string(),
  whatsappNumber: z.string(),
  notificationTypes: z.record(z.string(), notificationChannelSchema),
  enabledChannels: notificationChannelSchema,
});

export type NotificationSettingsFormValues = z.infer<typeof notificationSettingsSchema>;
