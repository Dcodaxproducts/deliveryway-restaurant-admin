"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

import {
  useGetNotificationSettings,
  useUpdateNotificationSettings,
} from "@/hooks/useNotifications";

/**
 * Types
 */
type Channel = "email" | "sms" | "whatsapp";

type NotificationType = Record<Channel, boolean>;
type NotificationTypes = Record<string, NotificationType>;

type NotificationFormState = {
  emailAddress: string;
  phoneNumber: string;
  whatsappNumber: string;
  notificationTypes: NotificationTypes;
};

type ChannelEnabledState = Record<Channel, boolean>;

/**
 * Default state
 */
const defaultState: NotificationFormState = {
  emailAddress: "",
  phoneNumber: "",
  whatsappNumber: "",
  notificationTypes: {},
};

const defaultEnabledState: ChannelEnabledState = {
  email: true,
  sms: true,
  whatsapp: true,
};

export default function NotificationForm() {
  const [form, setForm] = useState<NotificationFormState>(defaultState);
  const [enabledChannels, setEnabledChannels] =
    useState<ChannelEnabledState>(defaultEnabledState);

  const { data, isLoading } = useGetNotificationSettings();
  const mutation = useUpdateNotificationSettings();

  /**
   * Sync API → form
   */
  useEffect(() => {
    if (!data) {
      setForm(defaultState);
      setEnabledChannels(defaultEnabledState);
      return;
    }

    const safeForm: NotificationFormState = {
      emailAddress: data.emailAddress ?? "",
      phoneNumber: data.phoneNumber ?? "",
      whatsappNumber: data.whatsappNumber ?? "",
      notificationTypes: data.notificationTypes ?? {},
    };

    setForm(safeForm);

    const hasEmail =
      !!safeForm.emailAddress?.trim() ||
      Object.values(safeForm.notificationTypes || {}).some(
        (item) => item?.email === true
      );

    const hasSms =
      !!safeForm.phoneNumber?.trim() ||
      Object.values(safeForm.notificationTypes || {}).some(
        (item) => item?.sms === true
      );

    const hasWhatsapp =
      !!safeForm.whatsappNumber?.trim() ||
      Object.values(safeForm.notificationTypes || {}).some(
        (item) => item?.whatsapp === true
      );

    setEnabledChannels({
      email: hasEmail,
      sms: hasSms,
      whatsapp: hasWhatsapp,
    });
  }, [data]);

  /**
   * Derived values
   */
  const notificationKeys = Object.keys(form.notificationTypes || {});

  const visibleChannels = useMemo(() => {
    return (["email", "sms", "whatsapp"] as Channel[]).filter(
      (channel) => enabledChannels[channel]
    );
  }, [enabledChannels]);

  const hasVisibleSettings = visibleChannels.length > 0;

  /**
   * Handlers
   */
  const handleChannelToggle = (channel: Channel, enabled: boolean) => {
    setEnabledChannels((prev) => ({
      ...prev,
      [channel]: enabled,
    }));

    if (!enabled) {
      const updated: NotificationTypes = { ...form.notificationTypes };

      Object.keys(updated).forEach((key) => {
        updated[key] = {
          ...updated[key],
          [channel]: false,
        };
      });

      setForm((prev) => ({
        ...prev,
        emailAddress: channel === "email" ? "" : prev.emailAddress,
        phoneNumber: channel === "sms" ? "" : prev.phoneNumber,
        whatsappNumber:
          channel === "whatsapp" ? "" : prev.whatsappNumber,
        notificationTypes: updated,
      }));
    }
  };

  const handleCheckboxChange = (
    type: string,
    channel: Channel,
    value: boolean
  ) => {
    setForm((prev) => ({
      ...prev,
      notificationTypes: {
        ...prev.notificationTypes,
        [type]: {
          email: prev.notificationTypes[type]?.email ?? false,
          sms: prev.notificationTypes[type]?.sms ?? false,
          whatsapp: prev.notificationTypes[type]?.whatsapp ?? false,
          [channel]: value,
        },
      },
    }));
  };

  const handleSave = () => {
    const payload = {
      emailAddress: enabledChannels.email ? form.emailAddress : "",
      phoneNumber: enabledChannels.sms ? form.phoneNumber : "",
      whatsappNumber: enabledChannels.whatsapp
        ? form.whatsappNumber
        : "",
      notificationTypes: Object.fromEntries(
        Object.entries(form.notificationTypes || {}).map(([key, value]) => [
          key,
          {
            email: enabledChannels.email ? value?.email ?? false : false,
            sms: enabledChannels.sms ? value?.sms ?? false : false,
            whatsapp: enabledChannels.whatsapp
              ? value?.whatsapp ?? false
              : false,
          },
        ])
      ),
    };

    mutation.mutate(payload);
  };

  const handleCancel = () => {
    if (!data) {
      setForm(defaultState);
      setEnabledChannels(defaultEnabledState);
      return;
    }

    const safeForm: NotificationFormState = {
      emailAddress: data.emailAddress ?? "",
      phoneNumber: data.phoneNumber ?? "",
      whatsappNumber: data.whatsappNumber ?? "",
      notificationTypes: data.notificationTypes ?? {},
    };

    setForm(safeForm);

    const hasEmail =
      !!safeForm.emailAddress?.trim() ||
      Object.values(safeForm.notificationTypes || {}).some(
        (item) => item?.email === true
      );

    const hasSms =
      !!safeForm.phoneNumber?.trim() ||
      Object.values(safeForm.notificationTypes || {}).some(
        (item) => item?.sms === true
      );

    const hasWhatsapp =
      !!safeForm.whatsappNumber?.trim() ||
      Object.values(safeForm.notificationTypes || {}).some(
        (item) => item?.whatsapp === true
      );

    setEnabledChannels({
      email: hasEmail,
      sms: hasSms,
      whatsapp: hasWhatsapp,
    });
  };

  return (
    <div className="space-y-8">
      {isLoading ? (
        <LoadingCard />
      ) : (
        <>
          {/* EMAIL */}
          <ChannelSection
            title="Email"
            value={form.emailAddress}
            enabled={enabledChannels.email}
            onChange={(val: string) =>
              setForm((prev) => ({ ...prev, emailAddress: val }))
            }
            onToggle={(val: boolean) => handleChannelToggle("email", val)}
          />

          {/* SMS */}
          <ChannelSection
            title="SMS"
            value={form.phoneNumber}
            enabled={enabledChannels.sms}
            onChange={(val: string) =>
              setForm((prev) => ({ ...prev, phoneNumber: val }))
            }
            onToggle={(val: boolean) => handleChannelToggle("sms", val)}
          />

          {/* WHATSAPP */}
          <ChannelSection
            title="Whatsapp"
            value={form.whatsappNumber}
            enabled={enabledChannels.whatsapp}
            onChange={(val: string) =>
              setForm((prev) => ({ ...prev, whatsappNumber: val }))
            }
            onToggle={(val: boolean) => handleChannelToggle("whatsapp", val)}
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
                      data={form.notificationTypes[key]}
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

          {/* ACTIONS */}
          {hasVisibleSettings && (
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
                type="button"
                onClick={handleSave}
                disabled={mutation.isPending}
                className="px-8 py-2.5"
              >
                {mutation.isPending ? "Saving..." : "Save & Activate"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Channel Section
 */
type ChannelSectionProps = {
  title: string;
  value: string;
  enabled: boolean;
  onChange: (val: string) => void;
  onToggle: (val: boolean) => void;
};

function ChannelSection({
  title,
  value,
  enabled,
  onChange,
  onToggle,
}: ChannelSectionProps) {
  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {enabled
              ? `This channel is active for notifications.`
              : `This channel is currently disabled.`}
          </p>
        </div>

        <Switch
          checked={enabled}
          onCheckedChange={(val: boolean) => onToggle(val)}
          className="data-[state=checked]:bg-primary"
        />
      </div>

      {enabled && (
        <div className="mt-6 space-y-2">
          <Label className="text-sm font-medium text-foreground">
            {title} {title === "Email" ? "Address" : "Number"}
          </Label>
          <Input
            value={value ?? ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange(e.target.value)
            }
            className="h-[52px]"
            placeholder={
              title === "Email"
                ? "Enter email address"
                : `Enter ${title.toLowerCase()} number`
            }
          />
        </div>
      )}
    </div>
  );
}

/**
 * Notification Row
 */
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
            checked={data?.[channel] || false}
            onCheckedChange={(val) => onChange(channel, Boolean(val))}
            className="h-5 w-5 border-2 border-slate-400 data-[state=checked]:border-primary"
          />
        </div>
      ))}
    </div>
  );
}

/**
 * Empty State Card
 */
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

/**
 * Loading Card
 */
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

/**
 * Helper
 */
function formatLabel(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
}