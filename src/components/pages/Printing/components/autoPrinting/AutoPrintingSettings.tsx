"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Check, ChevronDown, Loader2, Printer, RefreshCw } from "lucide-react";
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

const getStatusClass = (status?: string) => {
  const value = status?.toLowerCase();

  if (
    value === "connected" ||
    value === "online" ||
    value === "healthy" ||
    value === "success"
  ) {
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
      <div className="mt-6 rounded-xl bg-white p-8">
        <div className="h-[420px] w-full animate-pulse rounded-xl bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-xl bg-white p-8">
      <div className="mb-12 flex items-start justify-between gap-6">
        <div>
          <h3 className="text-2xl font-semibold">{t("printerStatus")}</h3>

          <p className="mt-2 text-sm text-gray-500">
            {t("source")}:{" "}
            <span className="font-medium capitalize text-gray-700">
              {source || t("restaurant")}
            </span>
            {inheritedFromRestaurant
              ? ` · ${t("inheritedFromRestaurant")}`
              : ""}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-600 md:grid-cols-4">
            <div className="rounded-lg border border-gray-100 p-3">
              <p className="text-xs text-gray-400">{t("totalEvents")}</p>
              <p className="font-semibold text-gray-800">
                {health?.totalEvents ?? 0}
              </p>
            </div>

            <div className="rounded-lg border border-gray-100 p-3">
              <p className="text-xs text-gray-400">{t("success")}</p>
              <p className="font-semibold text-green-600">
                {health?.successCount ?? 0}
              </p>
            </div>

            <div className="rounded-lg border border-gray-100 p-3">
              <p className="text-xs text-gray-400">{t("failed")}</p>
              <p className="font-semibold text-red-600">
                {health?.failedCount ?? 0}
              </p>
            </div>

            <div className="rounded-lg border border-gray-100 p-3">
              <p className="text-xs text-gray-400">{t("warnings")}</p>
              <p className="font-semibold text-yellow-600">
                {health?.warningCount ?? 0}
              </p>
            </div>
          </div>
        </div>

        <div className="text-right">
          <p className={`text-m font-medium ${getStatusClass(health?.status)}`}>
            {normalizeStatus(health?.status)}
          </p>

          <p className="text-xs text-gray-600">
            {t("latest")}:{" "}
            {health?.latest
              ? formatDateTime(health.latest.timestamp)
              : t("noRecentActivity")}
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
            {commonT("refresh")}
          </Button>
        </div>
      </div>

      <div className="mb-12">
        <h3 className="mb-6 text-2xl font-semibold">{t("connectPrinter")}</h3>

        <div className="mb-6">
          <label className="mb-2 block text-[16px]">
            {t("connectionType")}
          </label>

          <div className="relative">
            <select
              value={form.connectionType}
              onChange={(event) =>
                handleConnectionTypeChange(event.target.value as ConnectionType)
              }
              className="h-11 w-full appearance-none rounded-[10px] border border-[#BBBBBB] px-4 pr-12 text-sm text-gray-500 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="">{t("selectConnectionType")}</option>
              <option value="USB">USB</option>
              <option value="LAN">{t("networkIp")}</option>
              <option value="BLUETOOTH">{t("bluetooth")}</option>
              <option value="CLOUD">{t("printQueue")}</option>
            </select>

            <div className="pointer-events-none absolute right-0 top-0 flex h-full w-10 items-center justify-center rounded-r-[10px] bg-primary">
              <ChevronDown size={16} className="text-white" />
            </div>
          </div>
        </div>

        {isLocalConnection ? (
          <div className="mb-6 rounded-xl border border-gray-200 p-4">
            <div className="mb-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{t("installedPrinters")}</p>
                <p className="text-xs text-gray-500">{t("qzTrayHint")}</p>
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

            <select
              aria-label={t("printerName")}
              value={form.printerName}
              onChange={(event) => handlePrinterSelection(event.target.value)}
              disabled={discovering || availablePrinters.length === 0}
              className="h-11 w-full rounded-[10px] border border-[#BBBBBB] px-4 text-sm text-gray-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-gray-100"
            >
              <option value="">{t("selectPrinter")}</option>
              {availablePrinters.map((printer) => (
                <option key={printer} value={printer}>
                  {printer}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {isLocalConnection ? (
          <div className="mb-6">
            <label className="mb-2 block text-[16px]">{t("printMode")}</label>
            <select
              value={form.printMode}
              onChange={(event) =>
                handlePrintModeChange(event.target.value as PrintingMode)
              }
              className="h-11 w-full rounded-[10px] border border-[#BBBBBB] px-4 text-sm text-gray-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="ESC_POS">{t("printModeEscPos")}</option>
              <option value="PIXEL_HTML">{t("printModePixelHtml")}</option>
            </select>
            <p className="mt-2 text-xs text-gray-500">
              {form.printMode === "ESC_POS"
                ? t("printModeEscPosHint")
                : t("printModePixelHtmlHint")}
            </p>
          </div>
        ) : null}

        <div className="mb-6">
          <label className="mb-2 block text-[16px]">{t("paperSize")}</label>
          <select
            value={form.paperSize}
            onChange={(event) =>
              updateField("paperSize", event.target.value as PrintingPaperSize)
            }
            className="h-11 w-full rounded-[10px] border border-[#BBBBBB] px-4 text-sm text-gray-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          >
            <option value="80MM">80 mm</option>
            <option value="58MM">58 mm</option>
            <option value="A4" disabled={form.printMode === "ESC_POS"}>
              A4
            </option>
            <option value="A5" disabled={form.printMode === "ESC_POS"}>
              A5
            </option>
          </select>
          <p className="mt-2 text-xs text-gray-500">{t("paperSizeHint")}</p>
        </div>

        {form.connectionType === "CLOUD" ? (
          <div className="mb-6 space-y-3">
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
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

        <div className="flex flex-wrap justify-end gap-3">
          {isLocalConnection ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleTestPrint}
              disabled={testing || discovering || !form.printerName}
              className="h-[40px] rounded-[12px] px-8"
            >
              {testing ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : (
                <Printer size={16} className="mr-2" />
              )}
              {t("testPrint")}
            </Button>
          ) : null}
          <Button
            type="button"
            onClick={handleSave}
            disabled={updating || discovering || testing}
            className="h-[40px] rounded-[12px] bg-primary px-16 py-1.5 hover:bg-red-800"
          >
            {updating ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                {commonT("saving")}
              </>
            ) : (
              t("connect")
            )}
          </Button>
        </div>
      </div>

      <div className="mb-12">
        <h3 className="mb-6 text-2xl font-semibold">{t("printSettings")}</h3>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">{t("printingEnabled")}</span>
            <Switch
              checked={form.enabled}
              onCheckedChange={handlePrintingEnabledChange}
            />
          </div>

          <div>
            <p className="mb-3 text-sm font-medium">{t("printCopies")}</p>

            <div className="flex flex-wrap gap-6">
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
        <h3 className="mb-6 text-2xl font-semibold">{t("orderPrintRules")}</h3>

        <div className="space-y-3">
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
                {commonT("saving")}
              </>
            ) : (
              t("saveSettings")
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
