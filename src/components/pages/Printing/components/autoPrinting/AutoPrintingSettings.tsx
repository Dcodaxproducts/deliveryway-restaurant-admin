"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Check, ChevronDown, Loader2, RefreshCw } from "lucide-react";
import FormInput from "@/components/forms/common/FormInput";
import { useAuth } from "@/hooks/useAuth";
import {
  useGetAdminPrintingSettings,
  useGetAdminPrintingStatus,
  useUpdateAdminPrintingSettings,
} from "@/hooks/usePrinting";
import { toast } from "sonner";

type ConnectionType = "USB" | "NETWORK" | "QUEUE" | "";

type AutoPrintingSettingsProps = {
  branchId?: string | null;
};

type PrintingSettings = {
  enabled: boolean;
  autoPrintOnNewOrder: boolean;
  autoPrintOnStatusChange: boolean;
  printCustomerReceipt: boolean;
  printKitchenTicket: boolean;
  connectionType: ConnectionType;
  printerName: string;
  printerTarget: string;
  deviceId: string;
  ipAddress: string;
  queueName: string;
};

const defaultSettings: PrintingSettings = {
  enabled: false,
  autoPrintOnNewOrder: false,
  autoPrintOnStatusChange: false,
  printCustomerReceipt: false,
  printKitchenTicket: false,
  connectionType: "",
  printerName: "",
  printerTarget: "",
  deviceId: "",
  ipAddress: "",
  queueName: "",
};

const normalizeStatus = (status?: string) => {
  if (!status) return "Tracking Pending";

  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const getStatusClass = (status?: string) => {
  const value = status?.toLowerCase();

  if (value === "connected" || value === "online" || value === "healthy") {
    return "text-green-600";
  }

  if (value === "offline" || value === "failed" || value === "error") {
    return "text-red-600";
  }

  return "text-yellow-600";
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "No recent activity";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
};

export default function AutoPrintingSettings({
  branchId,
}: AutoPrintingSettingsProps) {
  const { restaurantId, branchId: authBranchId, isBranchAdmin, loading: authLoading } = useAuth();
  const effectiveBranchId = branchId || (isBranchAdmin ? authBranchId : undefined);

  const queryParams = useMemo(() => {
    if (!restaurantId) return undefined;

    return {
      restaurantId,
      branchId: effectiveBranchId || undefined,
    };
  }, [restaurantId, effectiveBranchId]);

  const {
    data: settingsResponse,
    isLoading: settingsLoading,
    isFetching: settingsFetching,
    refetch: refetchSettings,
  } = useGetAdminPrintingSettings(queryParams);

  const {
    data: statusResponse,
    isLoading: statusLoading,
    isFetching: statusFetching,
    refetch: refetchStatus,
  } = useGetAdminPrintingStatus(queryParams);

  const { mutateAsync: updateSettings, isPending: updating } =
    useUpdateAdminPrintingSettings();

  const apiSettings = settingsResponse?.data?.settings;
  const source = settingsResponse?.data?.source;
  const inheritedFromRestaurant =
    settingsResponse?.data?.inheritedFromRestaurant;

  const health = statusResponse?.data?.health;

  const [form, setForm] = useState<PrintingSettings>(defaultSettings);

  const loading = authLoading || settingsLoading || statusLoading;
  const refreshing = settingsFetching || statusFetching;

  useEffect(() => {
    if (!apiSettings) return;

    setForm({
      enabled: Boolean(apiSettings.enabled),
      autoPrintOnNewOrder: Boolean(apiSettings.autoPrintOnNewOrder),
      autoPrintOnStatusChange: Boolean(apiSettings.autoPrintOnStatusChange),
      printCustomerReceipt: Boolean(apiSettings.printCustomerReceipt),
      printKitchenTicket: Boolean(apiSettings.printKitchenTicket),
      connectionType: apiSettings.connectionType || "",
      printerName: apiSettings.printerName || "",
      printerTarget: apiSettings.printerTarget || "",
      deviceId: apiSettings.deviceId || "",
      ipAddress: apiSettings.ipAddress || "",
      queueName: apiSettings.queueName || "",
    });
  }, [apiSettings]);

  const updateField = <K extends keyof PrintingSettings>(
    key: K,
    value: PrintingSettings[K]
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const toggleCheckbox = (
    key:
      | "printKitchenTicket"
      | "printCustomerReceipt"
      | "autoPrintOnNewOrder"
      | "autoPrintOnStatusChange"
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleRefresh = async () => {
    await Promise.all([refetchSettings(), refetchStatus()]);
  };

  const handleSave = async () => {
    if (!restaurantId) {
      toast.error("Restaurant ID is missing.");
      return;
    }

    try {
      await updateSettings({
        restaurantId,
        branchId: effectiveBranchId || undefined,

        enabled: form.enabled,
        autoPrintOnNewOrder: form.autoPrintOnNewOrder,
        autoPrintOnStatusChange: form.autoPrintOnStatusChange,
        printCustomerReceipt: form.printCustomerReceipt,
        printKitchenTicket: form.printKitchenTicket,
        connectionType: form.connectionType || undefined,
        printerName: form.printerName || undefined,
        printerTarget: form.printerTarget || undefined,
        deviceId: form.deviceId || undefined,
        ipAddress: form.ipAddress || undefined,
        queueName: form.queueName || undefined,
      } as any);

      toast.success("Printing settings updated successfully.");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to update printing settings."
      );
    }
  };

  if (loading) {
    return (
      <div className="mt-6 rounded-xl bg-white p-8">
        <div className="h-[420px] w-full animate-pulse rounded-xl bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-xl bg-white p-8">
      <div className="mb-12 flex items-start justify-between gap-6">
        <div>
          <h3 className="text-2xl font-semibold">Printer Status</h3>

          <p className="mt-2 text-sm text-gray-500">
            Source:{" "}
            <span className="font-medium capitalize text-gray-700">
              {source || "restaurant"}
            </span>
            {inheritedFromRestaurant ? " · Inherited from restaurant" : ""}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-600 md:grid-cols-4">
            <div className="rounded-lg border border-gray-100 p-3">
              <p className="text-xs text-gray-400">Total Events</p>
              <p className="font-semibold text-gray-800">
                {health?.totalEvents ?? 0}
              </p>
            </div>

            <div className="rounded-lg border border-gray-100 p-3">
              <p className="text-xs text-gray-400">Success</p>
              <p className="font-semibold text-green-600">
                {health?.successCount ?? 0}
              </p>
            </div>

            <div className="rounded-lg border border-gray-100 p-3">
              <p className="text-xs text-gray-400">Failed</p>
              <p className="font-semibold text-red-600">
                {health?.failedCount ?? 0}
              </p>
            </div>

            <div className="rounded-lg border border-gray-100 p-3">
              <p className="text-xs text-gray-400">Warnings</p>
              <p className="font-semibold text-yellow-600">
                {health?.warningCount ?? 0}
              </p>
            </div>
          </div>
        </div>

        <div className="text-right">
          <p
            className={`text-m font-medium ${getStatusClass(health?.status)}`}
          >
            {normalizeStatus(health?.status)}
          </p>

          <p className="text-xs text-gray-600">
            Latest: {formatDateTime(health?.latest)}
          </p>

          {health?.latestErrorMessage ? (
            <p className="mt-1 max-w-[260px] text-xs text-red-500">
              {health.latestErrorMessage}
            </p>
          ) : null}

          <Button
            size="sm"
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="mt-5 h-[40px] rounded-[12px] bg-primary px-8 hover:bg-red-800"
          >
            {refreshing ? (
              <Loader2 size={16} className="mr-2 animate-spin" />
            ) : (
              <RefreshCw size={16} className="mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>

<div className="mb-12">
  <h3 className="mb-6 text-2xl font-semibold">Connect Printer</h3>

  <div className="mb-6">
    <label className="mb-2 block text-[16px]">Connection Type</label>

    <div className="relative">
      <select
        value={form.connectionType}
        onChange={(event) =>
          updateField("connectionType", event.target.value as ConnectionType)
        }
        className="h-11 w-full appearance-none rounded-[10px] border border-[#BBBBBB] px-4 pr-12 text-sm text-gray-500 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
      >
        <option value="">Select connection type</option>
        <option value="USB">USB</option>
        <option value="NETWORK">Network / IP</option>
        <option value="QUEUE">Print Queue</option>
      </select>

      <div className="pointer-events-none absolute right-0 top-0 flex h-full w-10 items-center justify-center rounded-r-[10px] bg-primary">
        <ChevronDown size={16} className="text-white" />
      </div>
    </div>
  </div>

  <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
    <FormInput
      label="Printer Name"
      placeholder="eg. Kitchen Printer"
      value={form.printerName}
      onChange={(value) => updateField("printerName", value)}
    />

    <FormInput
      label="Printer Target"
      placeholder="eg. EPSON-TM-T20"
      value={form.printerTarget}
      onChange={(value) => updateField("printerTarget", value)}
    />

    <FormInput
      label="Device ID"
      placeholder="eg. USB_DEVICE_001"
      value={form.deviceId}
      onChange={(value) => updateField("deviceId", value)}
    />

    <FormInput
      label="IP Address"
      placeholder="eg. 192.168.1.50"
      value={form.ipAddress}
      onChange={(value) => updateField("ipAddress", value)}
    />

    <FormInput
      label="Queue Name"
      placeholder="eg. kitchen-printer-queue"
      value={form.queueName}
      onChange={(value) => updateField("queueName", value)}
    />
  </div>

  <div className="flex justify-end">
    <Button
      type="button"
      onClick={handleSave}
      disabled={updating}
      className="h-[40px] rounded-[12px] bg-primary px-16 py-1.5 hover:bg-red-800"
    >
      {updating ? (
        <>
          <Loader2 size={16} className="mr-2 animate-spin" />
          Saving...
        </>
      ) : (
        "Connect"
      )}
    </Button>
  </div>
</div>

      <div className="mb-12">
        <h3 className="mb-6 text-2xl font-semibold">Print Settings</h3>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Printing Enabled</span>
            <Switch
              checked={form.enabled}
              onCheckedChange={(checked) => updateField("enabled", checked)}
            />
          </div>

          <div>
            <p className="mb-3 text-sm font-medium">Print Copies</p>

            <div className="flex flex-wrap gap-6">
              {[
                {
                  label: "Kitchen Ticket",
                  key: "printKitchenTicket" as const,
                },
                {
                  label: "Customer Receipt",
                  key: "printCustomerReceipt" as const,
                },
              ].map((item) => (
                <button
                  type="button"
                  key={item.key}
                  onClick={() => toggleCheckbox(item.key)}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-[4px] border ${
                      form[item.key]
                        ? "border-primary bg-primary"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    {form[item.key] ? (
                      <Check className="h-3 w-3 text-white" />
                    ) : null}
                  </span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-6 text-2xl font-semibold">Order Print Rules</h3>

        <div className="space-y-3">
          {[
            {
              label: "Print New Orders Automatically",
              key: "autoPrintOnNewOrder" as const,
            },
            {
              label: "Print Updated Orders / Status Changes",
              key: "autoPrintOnStatusChange" as const,
            },
          ].map((rule) => (
            <button
              type="button"
              key={rule.key}
              onClick={() => toggleCheckbox(rule.key)}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-[4px] border ${
                  form[rule.key]
                    ? "border-primary bg-primary"
                    : "border-gray-300 bg-white"
                }`}
              >
                {form[rule.key] ? (
                  <Check className="h-3 w-3 text-white" />
                ) : null}
              </span>
              {rule.label}
            </button>
          ))}
        </div>

        <div className="mt-8 flex justify-end">
          <Button
            type="button"
            onClick={handleSave}
            disabled={updating}
            className="h-[40px] rounded-[12px] bg-primary px-16 py-1.5 hover:bg-red-800"
          >
            {updating ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
