"use client";

import { FormSelect } from "@/components/ui/form-select";

import { useEffect, useMemo, useState } from "react";
import { FormActions } from "@/components/common/FormLayout";
import { FormField } from "@/components/common/FormField";
import PromotionStatCard from "@/components/cards/PromotionStatCard";
import { SectionCard } from "@/components/common/SectionCard";
import { SettingsLayout } from "@/components/common/SettingsLayout";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Activity,
  CircleCheck,
  CircleX,
  Loader2,
  Printer,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import FormInput from "@/components/forms/common/FormInput";
import { useAuth } from "@/hooks/useAuth";
import {
  useGetAdminPrintingSettings,
  useGetAdminPrintingStatus,
  useReportAdminPrinterEvent,
  useUpdateAdminPrintingSettings,
} from "@/hooks/usePrinting";
import { formatDateTime24 } from "@/lib/date-time-format";
import { getApiErrorMessage } from "@/lib/errors";
import {
  discoverLocalPrinters,
  printLocalTestTicket,
} from "@/lib/local-printer";
import { validatePrinterConnection } from "@/lib/printing-settings-validation";
import type {
  PrintingConnectionType,
  PrintingMode,
  PrintingPaperSize,
} from "@/services/printing";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

type ConnectionType = PrintingConnectionType | "";

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
  paperSize: PrintingPaperSize;
  printMode: PrintingMode;
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
  paperSize: "80MM",
  printMode: "PIXEL_HTML",
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

const getStatusTone = (status?: string): "success" | "danger" | "warning" => {
  const value = status?.toLowerCase();

  if (
    value === "connected" ||
    value === "online" ||
    value === "healthy" ||
    value === "success"
  ) {
    return "success";
  }

  if (value === "offline" || value === "failed" || value === "error") {
    return "danger";
  }

  return "warning";
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "No recent activity";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return formatDateTime24({ value: date, fallback: value });
};

export default function AutoPrintingSettings({
  branchId,
}: AutoPrintingSettingsProps) {
  const t = useTranslations("printing");
  const commonT = useTranslations("common");
  const {
    restaurantId,
    branchId: authBranchId,
    isBranchAdmin,
    loading: authLoading,
  } = useAuth();
  const effectiveBranchId =
    branchId || (isBranchAdmin ? authBranchId : undefined);

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
  const { mutateAsync: reportPrinterEvent } = useReportAdminPrinterEvent();

  const apiSettings = settingsResponse?.data?.settings;
  const source = settingsResponse?.data?.source;
  const inheritedFromRestaurant =
    settingsResponse?.data?.inheritedFromRestaurant;

  const health = statusResponse?.data?.health;

  const [form, setForm] = useState<PrintingSettings>(defaultSettings);
  const [availablePrinters, setAvailablePrinters] = useState<string[]>([]);
  const [discovering, setDiscovering] = useState(false);
  const [testing, setTesting] = useState(false);

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
      paperSize: apiSettings.paperSize || "80MM",
      printMode: apiSettings.printMode || "PIXEL_HTML",
      printerName: apiSettings.printerName || "",
      printerTarget: apiSettings.printerTarget || "",
      deviceId: apiSettings.deviceId || "",
      ipAddress: apiSettings.ipAddress || "",
      queueName: apiSettings.queueName || "",
    });
  }, [apiSettings]);

  const updateField = <K extends keyof PrintingSettings>(
    key: K,
    value: PrintingSettings[K],
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
      | "autoPrintOnStatusChange",
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handlePrintingEnabledChange = (enabled: boolean) => {
    setForm((previous) => ({
      ...previous,
      enabled,
      autoPrintOnNewOrder:
        enabled &&
        !previous.autoPrintOnNewOrder &&
        !previous.autoPrintOnStatusChange
          ? true
          : previous.autoPrintOnNewOrder,
      printKitchenTicket:
        enabled &&
        !previous.printKitchenTicket &&
        !previous.printCustomerReceipt
          ? true
          : previous.printKitchenTicket,
    }));
  };

  const handleRefresh = async () => {
    await Promise.all([refetchSettings(), refetchStatus()]);
  };

  const reportLocalEvent = async (
    event: "discovery" | "connection" | "test_print",
    status: "success" | "failed" | "warning",
    message: string,
    printerName?: string,
  ) => {
    if (!restaurantId) return;

    try {
      await reportPrinterEvent({
        restaurantId,
        branchId: effectiveBranchId || undefined,
        event,
        status,
        message,
        ...(printerName ? { printerName } : {}),
      });
    } catch {
      // Local discovery and printing must still work if health reporting fails.
    }
  };

  const handleDiscoverPrinters = async () => {
    setDiscovering(true);

    try {
      const printers = await discoverLocalPrinters();
      setAvailablePrinters(printers);

      if (printers.length === 0) {
        updateField("printerName", "");
        await reportLocalEvent(
          "discovery",
          "warning",
          "QZ Tray connected, but no installed printer queues were found.",
        );
        toast.error(t("toast.noPrinters"));
        return;
      }

      if (!printers.includes(form.printerName)) {
        handlePrinterSelection(printers[0]);
      }
      await reportLocalEvent(
        "discovery",
        "success",
        `Discovered ${printers.length} local printer queue(s).`,
      );
      toast.success(t("toast.printersFound", { count: printers.length }));
    } catch (error: unknown) {
      setAvailablePrinters([]);
      updateField("printerName", "");
      const message = getApiErrorMessage(error, t("toast.discoveryFailed"));
      await reportLocalEvent("discovery", "failed", message);
      toast.error(message);
    } finally {
      setDiscovering(false);
    }
  };

  const handleConnectionTypeChange = (connectionType: ConnectionType) => {
    updateField("connectionType", connectionType);

    if (connectionType === "CLOUD" || connectionType === "") {
      setAvailablePrinters([]);
      updateField("printerName", "");
      return;
    }

    void handleDiscoverPrinters();
  };

  const handlePrinterSelection = (printerName: string) => {
    setForm((previous) => ({
      ...previous,
      printerName,
      ...(/generic\s*\/\s*text only/i.test(printerName)
        ? {
            printMode: "ESC_POS" as const,
            paperSize:
              previous.paperSize === "A4" || previous.paperSize === "A5"
                ? ("80MM" as const)
                : previous.paperSize,
          }
        : {}),
    }));
  };

  const handlePrintModeChange = (printMode: PrintingMode) => {
    setForm((previous) => ({
      ...previous,
      printMode,
      paperSize:
        printMode === "ESC_POS" &&
        (previous.paperSize === "A4" || previous.paperSize === "A5")
          ? "80MM"
          : previous.paperSize,
    }));
  };

  const isLocalConnection =
    form.connectionType === "USB" ||
    form.connectionType === "LAN" ||
    form.connectionType === "BLUETOOTH";

  const handleSave = async () => {
    if (!restaurantId) {
      toast.error(t("toast.restaurantMissing"));
      return;
    }

    const validationError = validatePrinterConnection(form);
    if (validationError) {
      toast.error(t(`toast.${validationError}`));
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
        connectionType: form.connectionType || null,
        paperSize: form.paperSize,
        printMode: form.printMode,
        printerName: form.printerName.trim() || null,
        printerTarget: form.printerTarget.trim() || null,
        deviceId: form.deviceId.trim() || null,
        ipAddress: form.ipAddress.trim() || null,
        queueName: form.queueName.trim() || null,
      });

      if (isLocalConnection) {
        await reportLocalEvent(
          "connection",
          "success",
          "Local printer connection settings saved.",
          form.printerName,
        );
      }

      toast.success(t("toast.updated"));
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, t("toast.failedUpdate")));
    }
  };

  const handleTestPrint = async () => {
    if (!form.printerName.trim()) {
      toast.error(t("toast.printerRequired"));
      return;
    }

    setTesting(true);
    try {
      await printLocalTestTicket(
        form.printerName,
        form.paperSize,
        form.printMode,
      );
      await reportLocalEvent(
        "test_print",
        "success",
        "Test print completed successfully.",
        form.printerName,
      );
      toast.success(t("toast.testPrintSent"));
    } catch (error: unknown) {
      const message = getApiErrorMessage(error, t("toast.testPrintFailed"));
      await reportLocalEvent("test_print", "failed", message, form.printerName);
      toast.error(message);
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <SectionCard className="mt-5">
        <div className="h-[360px] w-full animate-pulse rounded-[var(--ui-radius-card)] bg-[var(--ui-skeleton)]" />
      </SectionCard>
    );
  }

  return (
    <SettingsLayout className="mt-5">
      <SectionCard
        title={t("printerStatus")}
        description={`${t("source")}: ${source || t("restaurant")}${
          inheritedFromRestaurant ? ` · ${t("inheritedFromRestaurant")}` : ""
        }`}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge tone={getStatusTone(health?.status)} size="sm">
              {normalizeStatus(health?.status)}
            </StatusBadge>
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="animate-spin" />
              ) : (
                <RefreshCw />
              )}
              {commonT("refresh")}
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <PromotionStatCard
            icon={<Activity className="size-4" />}
            value={health?.totalEvents ?? 0}
            label={t("totalEvents")}
          />
          <PromotionStatCard
            icon={<CircleCheck className="size-4" />}
            value={health?.successCount ?? 0}
            label={t("success")}
          />
          <PromotionStatCard
            icon={<CircleX className="size-4" />}
            value={health?.failedCount ?? 0}
            label={t("failed")}
          />
          <PromotionStatCard
            icon={<TriangleAlert className="size-4" />}
            value={health?.warningCount ?? 0}
            label={t("warnings")}
          />
        </div>

        <div className="mt-3 flex flex-col gap-1 text-xs text-[var(--ui-text-muted)] sm:flex-row sm:items-center sm:justify-between">
          <span>
            {t("latest")}:{" "}
            {health?.latest
              ? formatDateTime(health.latest.timestamp)
              : t("noRecentActivity")}
          </span>
          {health?.latestErrorMessage ? (
            <span className="text-[var(--ui-danger)]">
              {health.latestErrorMessage}
            </span>
          ) : null}
        </div>
      </SectionCard>

      <div className="grid min-w-0 gap-5 xl:grid-cols-2 xl:items-start">
        <SectionCard title={t("connectPrinter")}>
          <div className="space-y-4">
            <FormField id="printer-connection-type" label={t("connectionType")}>
              {(controlProps) => (
                <FormSelect
                  {...controlProps}
                  value={form.connectionType}
                  onChange={(event) =>
                    handleConnectionTypeChange(
                      event.target.value as ConnectionType,
                    )
                  }
                  className="w-full"
                >
                  <option value="">{t("selectConnectionType")}</option>
                  <option value="USB">USB</option>
                  <option value="LAN">{t("networkIp")}</option>
                  <option value="BLUETOOTH">{t("bluetooth")}</option>
                  <option value="CLOUD">{t("printQueue")}</option>
                </FormSelect>
              )}
            </FormField>

            {isLocalConnection ? (
              <div className="rounded-[var(--ui-radius-card)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] p-3.5">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-[var(--ui-text)]">
                      {t("installedPrinters")}
                    </p>
                    <p className="text-xs text-[var(--ui-text-muted)]">
                      {t("qzTrayHint")}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDiscoverPrinters}
                    disabled={discovering}
                  >
                    {discovering ? (
                      <Loader2 size={16} className="mr-2 animate-spin" />
                    ) : (
                      <RefreshCw size={16} className="mr-2" />
                    )}
                    {t("scanPrinters")}
                  </Button>
                </div>

                <FormSelect
                  aria-label={t("printerName")}
                  value={form.printerName}
                  onChange={(event) =>
                    handlePrinterSelection(event.target.value)
                  }
                  disabled={discovering || availablePrinters.length === 0}
                  className="w-full"
                >
                  <option value="">{t("selectPrinter")}</option>
                  {availablePrinters.map((printer) => (
                    <option key={printer} value={printer}>
                      {printer}
                    </option>
                  ))}
                </FormSelect>
              </div>
            ) : null}

            {isLocalConnection ? (
              <FormField
                id="printer-print-mode"
                label={t("printMode")}
                help={
                  form.printMode === "ESC_POS"
                    ? t("printModeEscPosHint")
                    : t("printModePixelHtmlHint")
                }
              >
                {(controlProps) => (
                  <FormSelect
                    {...controlProps}
                    value={form.printMode}
                    onChange={(event) =>
                      handlePrintModeChange(event.target.value as PrintingMode)
                    }
                    className="w-full"
                  >
                    <option value="ESC_POS">{t("printModeEscPos")}</option>
                    <option value="PIXEL_HTML">
                      {t("printModePixelHtml")}
                    </option>
                  </FormSelect>
                )}
              </FormField>
            ) : null}

            <FormField
              id="printer-paper-size"
              label={t("paperSize")}
              help={t("paperSizeHint")}
            >
              {(controlProps) => (
                <FormSelect
                  {...controlProps}
                  value={form.paperSize}
                  onChange={(event) =>
                    updateField(
                      "paperSize",
                      event.target.value as PrintingPaperSize,
                    )
                  }
                  className="w-full"
                >
                  <option value="80MM">80 mm</option>
                  <option value="58MM">58 mm</option>
                  <option value="A4" disabled={form.printMode === "ESC_POS"}>
                    A4
                  </option>
                  <option value="A5" disabled={form.printMode === "ESC_POS"}>
                    A5
                  </option>
                </FormSelect>
              )}
            </FormField>

            {form.connectionType === "CLOUD" ? (
              <div className="space-y-3">
                <p className="rounded-[var(--ui-radius-control)] border border-[var(--ui-warning)]/20 bg-[var(--ui-warning-soft)] p-3 text-sm text-[var(--ui-warning)]">
                  {t("cloudQueueNotice")}
                </p>
                <FormInput
                  label={t("queueName")}
                  placeholder={t("queueNamePlaceholder")}
                  value={form.queueName}
                  onChange={(value) => updateField("queueName", value)}
                />
              </div>
            ) : null}

            <FormActions
              className="pt-3"
              secondary={
                isLocalConnection ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleTestPrint}
                    disabled={testing || discovering || !form.printerName}
                  >
                    {testing ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Printer size={16} />
                    )}
                    {t("testPrint")}
                  </Button>
                ) : null
              }
              primary={
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSave}
                  disabled={updating || discovering || testing}
                >
                  {updating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {commonT("saving")}
                    </>
                  ) : (
                    t("connect")
                  )}
                </Button>
              }
            />
          </div>
        </SectionCard>

        <SectionCard title={t("printSettings")}>
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4 rounded-[var(--ui-radius-card)] bg-[var(--ui-surface-subtle)] p-3.5">
              <span className="text-sm font-medium text-[var(--ui-text)]">
                {t("printingEnabled")}
              </span>
              <Switch
                checked={form.enabled}
                onCheckedChange={handlePrintingEnabledChange}
              />
            </div>

            <div>
              <p className="mb-3 text-sm font-medium text-[var(--ui-text)]">
                {t("printCopies")}
              </p>

              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  {
                    label: t("kitchenTicket"),
                    key: "printKitchenTicket" as const,
                  },
                  {
                    label: t("customerReceipt"),
                    key: "printCustomerReceipt" as const,
                  },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex cursor-pointer items-center gap-2 rounded-[var(--ui-radius-control)] border border-[var(--ui-border)] p-3 text-sm text-[var(--ui-text)]"
                  >
                    <Checkbox
                      checked={form[item.key]}
                      onCheckedChange={() => toggleCheckbox(item.key)}
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="border-t border-[var(--ui-border)] pt-5">
              <p className="mb-3 text-sm font-medium text-[var(--ui-text)]">
                {t("orderPrintRules")}
              </p>
              <div className="space-y-2">
                {[
                  {
                    label: t("printNewOrdersAutomatically"),
                    key: "autoPrintOnNewOrder" as const,
                  },
                  {
                    label: t("printUpdatedOrders"),
                    key: "autoPrintOnStatusChange" as const,
                  },
                ].map((rule) => (
                  <label
                    key={rule.key}
                    className="flex cursor-pointer items-center gap-2 rounded-[var(--ui-radius-control)] border border-[var(--ui-border)] p-3 text-sm text-[var(--ui-text)]"
                  >
                    <Checkbox
                      checked={form[rule.key]}
                      onCheckedChange={() => toggleCheckbox(rule.key)}
                    />
                    <span>{rule.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <FormActions
              className="pt-3"
              primary={
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSave}
                  disabled={updating}
                >
                  {updating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {commonT("saving")}
                    </>
                  ) : (
                    t("saveSettings")
                  )}
                </Button>
              }
            />
          </div>
        </SectionCard>
      </div>
    </SettingsLayout>
  );
}
