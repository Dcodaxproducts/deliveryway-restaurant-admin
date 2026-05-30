"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { useForm, type Path, type UseFormRegisterReturn } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  useGetNotificationSettings,
  useUpdateNotificationSettings,
} from "@/hooks/useNotifications";
import type { NotificationSettingsValues } from "@/services/notifications/notification-settings.api";
import {
  notificationSettingsSchema,
  type NotificationSettingsFormValues,
} from "@/validations/notifications";

type Channel = "email" | "sms" | "whatsapp";
type NotificationType = Record<Channel, boolean>;
type NotificationTypes = Record<string, NotificationType>;

const channels: Channel[] = ["email", "sms", "whatsapp"];

const defaultValues: NotificationSettingsFormValues = {
  emailAddress: "",
  phoneNumber: "",
  whatsappNumber: "",
  notificationTypes: {},
  enabledChannels: {
    email: true,
    sms: true,
    whatsapp: true,
  },
};

const channelInputConfig: Record<Channel, Path<NotificationSettingsFormValues>> = {
  email: "emailAddress",
  sms: "phoneNumber",
  whatsapp: "whatsappNumber",
};

export const buildNotificationFormValues = (
  data?: NotificationSettingsValues | null
): NotificationSettingsFormValues => {
  if (!data) return defaultValues;

  const notificationTypes = data.notificationTypes ?? {};
  const hasEmail =
    Boolean(data.emailAddress?.trim()) ||
    Object.values(notificationTypes).some((item) => item?.email === true);
  const hasSms =
    Boolean(data.phoneNumber?.trim()) ||
    Object.values(notificationTypes).some((item) => item?.sms === true);
  const hasWhatsapp =
    Boolean(data.whatsappNumber?.trim()) ||
    Object.values(notificationTypes).some((item) => item?.whatsapp === true);

  return {
    emailAddress: data.emailAddress ?? "",
    phoneNumber: data.phoneNumber ?? "",
    whatsappNumber: data.whatsappNumber ?? "",
    notificationTypes,
    enabledChannels: {
      email: hasEmail,
      sms: hasSms,
      whatsapp: hasWhatsapp,
    },
  };
};

export default function NotificationForm() {
  const { data, isLoading } = useGetNotificationSettings();
  const mutation = useUpdateNotificationSettings();

  const {
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
  } = useForm<NotificationSettingsFormValues>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues,
  });

  const emailAddress = watch("emailAddress");
  const phoneNumber = watch("phoneNumber");
  const whatsappNumber = watch("whatsappNumber");
  const notificationTypes = watch("notificationTypes");
  const enabledChannels = watch("enabledChannels");

  useEffect(() => {
    reset(buildNotificationFormValues(data));
  }, [data, reset]);

  const notificationKeys = Object.keys(notificationTypes ?? {});

  const visibleChannels = useMemo(() => {
    return channels.filter((channel) => enabledChannels[channel]);
  }, [enabledChannels]);

  const hasVisibleSettings = visibleChannels.length > 0;

  const handleChannelToggle = (channel: Channel, enabled: boolean) => {
    setValue(`enabledChannels.${channel}`, enabled, { shouldDirty: true });

    if (!enabled) {
      const updated: NotificationTypes = { ...(notificationTypes ?? {}) };

      Object.keys(updated).forEach((key) => {
        updated[key] = {
          ...updated[key],
          [channel]: false,
        };
      });

      setValue(channelInputConfig[channel], "", { shouldDirty: true });
      setValue("notificationTypes", updated, { shouldDirty: true });
    }
  };

  const handleCheckboxChange = (
    type: string,
    channel: Channel,
    value: boolean
  ) => {
    const currentType = notificationTypes?.[type];

    setValue(
      `notificationTypes.${type}`,
      {
        email: currentType?.email ?? false,
        sms: currentType?.sms ?? false,
        whatsapp: currentType?.whatsapp ?? false,
        [channel]: value,
      },
      { shouldDirty: true }
    );
  };

  const onSubmit = (values: NotificationSettingsFormValues) => {
    const payload = {
      emailAddress: values.enabledChannels.email ? values.emailAddress : "",
      phoneNumber: values.enabledChannels.sms ? values.phoneNumber : "",
      whatsappNumber: values.enabledChannels.whatsapp
        ? values.whatsappNumber
        : "",
      notificationTypes: Object.fromEntries(
        Object.entries(values.notificationTypes ?? {}).map(([key, value]) => [
          key,
          {
            email: values.enabledChannels.email ? value?.email ?? false : false,
            sms: values.enabledChannels.sms ? value?.sms ?? false : false,
            whatsapp: values.enabledChannels.whatsapp
              ? value?.whatsapp ?? false
              : false,
          },
        ])
      ),
    };

    mutation.mutate(payload);
  };

  const handleCancel = () => {
    reset(buildNotificationFormValues(data));
  };

  return (
    <form className="space-y-8" noValidate onSubmit={handleSubmit(onSubmit)}>
      {isLoading ? (
        <LoadingCard />
      ) : (
        <>
          <ChannelSection
            title="Email"
            inputId="notification-email-address"
            value={emailAddress}
            enabled={enabledChannels.email}
            registration={register("emailAddress")}
            onToggle={(checked) => handleChannelToggle("email", checked)}
          />

          <ChannelSection
            title="SMS"
            inputId="notification-sms-number"
            value={phoneNumber}
            enabled={enabledChannels.sms}
            registration={register("phoneNumber")}
            onToggle={(checked) => handleChannelToggle("sms", checked)}
          />

          <ChannelSection
            title="Whatsapp"
            inputId="notification-whatsapp-number"
            value={whatsappNumber}
            enabled={enabledChannels.whatsapp}
            registration={register("whatsappNumber")}
            onToggle={(checked) => handleChannelToggle("whatsapp", checked)}
          />

          {hasVisibleSettings ? (
            <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-foreground">
                  Notification Types
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose which active channels should receive each notification.
                </p>
              </div>

              <div
                className="grid gap-4 border-b border-border pb-4 font-medium text-sm text-foreground"
                style={{
                  gridTemplateColumns: `minmax(220px, 1.5fr) repeat(${visibleChannels.length}, minmax(90px, 1fr))`,
                }}
              >
                <div>Notification Type</div>
                {visibleChannels.map((channel) => (
                  <div key={channel} className="text-center">
                    {formatLabel(channel)}
                  </div>
                ))}
              </div>

              <div className="divide-y divide-border">
                {notificationKeys.length > 0 ? (
                  notificationKeys.map((key) => (
                    <NotificationRow
                      key={key}
                      label={formatLabel(key)}
                      data={notificationTypes[key]}
                      visibleChannels={visibleChannels}
                      onChange={(channel, value) =>
                        handleCheckboxChange(key, channel, value)
                      }
                    />
                  ))
                ) : (
                  <div className="py-8 text-sm text-muted-foreground">
                    No notification types available.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <EmptyStateCard
              title="No active channels available"
              description="Enable at least one channel to configure notification type preferences."
            />
          )}

          {hasVisibleSettings ? (
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                className="px-6 py-2"
                onClick={handleCancel}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={mutation.isPending}
                className="px-8 py-2.5"
              >
                {mutation.isPending ? "Saving..." : "Save & Activate"}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </form>
  );
}

type ChannelSectionProps = {
  title: string;
  inputId: string;
  value: string;
  enabled: boolean;
  registration: UseFormRegisterReturn;
  onToggle: (checked: boolean) => void;
};

function ChannelSection({
  title,
  inputId,
  value,
  enabled,
  registration,
  onToggle,
}: ChannelSectionProps) {
  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {enabled
              ? "This channel is active for notifications."
              : "This channel is currently disabled."}
          </p>
        </div>

        <Switch
          checked={enabled}
          onCheckedChange={(checked) => onToggle(checked === true)}
          className="data-[state=checked]:bg-primary"
        />
      </div>

      {enabled ? (
        <div className="mt-6 space-y-2">
          <Label htmlFor={inputId} className="text-sm font-medium text-foreground">
            {title} {title === "Email" ? "Address" : "Number"}
          </Label>
          <Input
            id={inputId}
            value={value ?? ""}
            className="h-[52px]"
            placeholder={
              title === "Email"
                ? "Enter email address"
                : `Enter ${title.toLowerCase()} number`
            }
            {...registration}
          />
        </div>
      ) : null}
    </div>
  );
}

type NotificationRowProps = {
  label: string;
  data: NotificationType;
  visibleChannels: Channel[];
  onChange: (channel: Channel, value: boolean) => void;
};

function NotificationRow({
  label,
  data,
  visibleChannels,
  onChange,
}: NotificationRowProps) {
  return (
    <div
      className="grid items-center gap-4 py-5"
      style={{
        gridTemplateColumns: `minmax(220px, 1.5fr) repeat(${visibleChannels.length}, minmax(90px, 1fr))`,
      }}
    >
      <div className="text-sm font-medium text-foreground">{label}</div>

      {visibleChannels.map((channel) => (
        <div key={channel} className="flex justify-center">
          <Checkbox
            checked={data?.[channel] ?? false}
            onCheckedChange={(checked) => onChange(channel, checked === true)}
            className="h-5 w-5 border-2 border-slate-400 data-[state=checked]:border-primary"
          />
        </div>
      ))}
    </div>
  );
}

function EmptyStateCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="rounded-2xl border border-border bg-white px-6 py-10 shadow-sm">
      <div className="animate-pulse space-y-4">
        <div className="h-5 w-48 rounded bg-slate-200" />
        <div className="h-12 w-full rounded bg-slate-200" />
        <div className="h-12 w-full rounded bg-slate-200" />
        <div className="h-12 w-full rounded bg-slate-200" />
      </div>
    </div>
  );
}

function formatLabel(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
}
