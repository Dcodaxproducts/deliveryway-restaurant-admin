"use client";

import type { Dispatch, SetStateAction } from "react";

import FormInput from "@/components/forms/common/FormInput";
import {
  BranchLocationPicker,
  type BranchLocationAddressFields,
} from "@/components/pages/Branches/components/BranchLocationPicker";
import Section from "@/components/pages/Promotions/forms/Section";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type {
  BranchFormData,
  BranchServiceChargeType,
} from "@/components/pages/branches/forms/EditBranchForm/types";
import { useTranslations } from "next-intl";

type EditBranchStepOneProps = {
  data: BranchFormData | null;
  setData: Dispatch<SetStateAction<BranchFormData | null>>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const toCoordinate = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const adminFieldConfigs = [
  { name: "firstName", labelKey: "firstName", type: "text" },
  { name: "lastName", labelKey: "lastName", type: "text" },
  { name: "email", labelKey: "email", type: "email" },
  { name: "phone", labelKey: "phone", type: "text" },
  { name: "password", labelKey: "password", type: "password" },
] as const;

function EditBranchStepOne({ data, setData }: EditBranchStepOneProps) {
  const t = useTranslations("branches");
  const commonT = useTranslations("common");

  if (!data) return null;

  const serviceCharge = data.settings?.serviceCharge ?? {
    isEnabled: false,
    type: "PERCENTAGE" as const,
    value: 0,
  };
  const serviceChargeEnabled = Boolean(serviceCharge.isEnabled);
  const serviceChargeType = serviceCharge.type ?? "PERCENTAGE";
  const addressLatitude = toCoordinate(data.address?.lat ?? data.lat);
  const addressLongitude = toCoordinate(data.address?.lng ?? data.lng);
  const initialMapPoint =
    addressLatitude !== null && addressLongitude !== null
      ? { lat: addressLatitude, lng: addressLongitude }
      : null;

  const update = (path: string[], value: unknown) => {
    setData((current) => {
      const newData: BranchFormData = { ...(current ?? data) };
      let obj = newData as Record<string, unknown>;

      for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        const existing = obj[key];
        const next = isRecord(existing) ? { ...existing } : {};
        obj[key] = next;
        obj = next;
      }

      obj[path[path.length - 1]] = value;
      return newData;
    });
  };

  const handleLocationFieldsChange = (fields: BranchLocationAddressFields) => {
    Object.entries(fields).forEach(([fieldName, value]) => {
      update(["address", fieldName], value);
    });
  };

  return (
    <div className="rounded-[14px] space-y-8">
      <Section label={t("addBranchInfo")}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label={t("branchNameRequired")}
            value={data.name || ""}
            onChange={(val) => update(["name"], val)}
          />

          <FormInput
            label={commonT("description")}
            value={data.description || ""}
            onChange={(val) => update(["description"], val)}
          />
        </div>

        <div className="space-y-2">
          <div>
            <h4 className="text-sm font-medium text-gray-900">
              {t("createBranchLocation")}
            </h4>
            <p className="mt-1 text-xs text-gray-500">
              {t("createBranchLocationDescription")}
            </p>
          </div>
          <BranchLocationPicker
            initialPoint={initialMapPoint}
            inputId="edit-branch-map-search"
            markerTitle={t("createBranchLocation")}
            onAddressFieldsChange={handleLocationFieldsChange}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label={t("street")}
            value={data.address?.street || ""}
            onChange={(val) => update(["address", "street"], val)}
          />

          <FormInput
            label={t("area")}
            value={data.address?.area || ""}
            onChange={(val) => update(["address", "area"], val)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label={t("city")}
            value={data.address?.city || ""}
            onChange={(val) => update(["address", "city"], val)}
          />

          <FormInput
            label={t("state")}
            value={data.address?.state || ""}
            onChange={(val) => update(["address", "state"], val)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label={t("country")}
            value={data.address?.country || ""}
            onChange={(val) => update(["address", "country"], val)}
          />

          <FormInput
            label={t("postalCode")}
            value={data.address?.postalCode || data.postalCode || ""}
            onChange={(val) => update(["address", "postalCode"], val)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label={t("latitude")}
            value={data.address?.lat === undefined ? "" : String(data.address.lat)}
            onChange={(val) => update(["address", "lat"], val)}
          />

          <FormInput
            label={t("longitude")}
            value={data.address?.lng === undefined ? "" : String(data.address.lng)}
            onChange={(val) => update(["address", "lng"], val)}
          />
        </div>
      </Section>

      <Section label={t("branchAdminInfo")}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {adminFieldConfigs.map((field) => (
            <FormInput
              key={field.name}
              label={t(field.labelKey)}
              type={field.type}
              placeholder={
                field.type === "password"
                  ? t("branchAdminPasswordEditPlaceholder")
                  : undefined
              }
              value={data.branchAdmin?.[field.name] || ""}
              onChange={(val) => update(["branchAdmin", field.name], val)}
              showPasswordToggle={field.type === "password"}
            />
          ))}
        </div>
      </Section>

      <Section label={t("contactInfo")}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label={commonT("phone")}
            value={data.settings?.contact?.phone || ""}
            onChange={(val) => update(["settings", "contact", "phone"], val)}
          />

          <FormInput
            label="WhatsApp"
            value={data.settings?.contact?.whatsapp || ""}
            onChange={(val) => update(["settings", "contact", "whatsapp"], val)}
          />
        </div>
      </Section>

      <Section label={t("settings")}>
        <div className="space-y-4">
          <FormInput
            label={t("estimatedPrepTime")}
            value={
              data.settings?.automation?.estimatedPrepTime === undefined
                ? ""
                : String(data.settings.automation.estimatedPrepTime)
            }
            onChange={(val) =>
              update(
                ["settings", "automation", "estimatedPrepTime"],
                Number(val)
              )
            }
          />

          <div className="space-y-3 rounded-[12px] border p-4">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {t("serviceCharge")}
              </p>
              <p className="text-xs text-gray-500">
                {t("serviceChargeDescription")}
              </p>
            </div>

            <div className="flex items-center justify-between rounded-[12px] border p-4">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {t("enableServiceCharge")}
                </p>
                <p className="text-xs text-gray-500">
                  {t("serviceChargeDescription")}
                </p>
              </div>

              <Switch
                checked={serviceChargeEnabled}
                onCheckedChange={(val) => {
                  update(["settings", "serviceCharge", "isEnabled"], val);

                  if (!val) {
                    update(["settings", "serviceCharge", "type"], "PERCENTAGE");
                    update(["settings", "serviceCharge", "value"], 0);
                  }
                }}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="edit-branch-service-charge-type"
                  className="block text-sm font-medium text-gray-900"
                >
                  {t("chargeType")}
                </label>
                <Select
                  disabled={!serviceChargeEnabled}
                  value={serviceChargeType}
                  onValueChange={(value: BranchServiceChargeType) =>
                    update(["settings", "serviceCharge", "type"], value)
                  }
                >
                  <SelectTrigger
                    id="edit-branch-service-charge-type"
                    className="h-[44px] rounded-[10px] border-gray-300 text-sm"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">{t("percentage")}</SelectItem>
                    <SelectItem value="AMOUNT">{t("fixedAmount")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="edit-branch-service-charge-value"
                  className="block text-sm font-medium text-gray-900"
                >
                  {serviceChargeType === "AMOUNT" ? t("amount") : t("percentage")}
                </label>
                <Input
                  id="edit-branch-service-charge-value"
                  type="number"
                  min={0}
                  max={serviceChargeType === "PERCENTAGE" ? 100 : undefined}
                  step="0.01"
                  value={String(serviceCharge.value ?? 0)}
                  disabled={!serviceChargeEnabled}
                  className="h-[44px] rounded-[10px] border-gray-300 text-sm"
                  onChange={(event) =>
                    update(
                      ["settings", "serviceCharge", "value"],
                      event.target.value ? Number(event.target.value) : 0
                    )
                  }
                />
                <p className="text-xs text-gray-500">
                  {serviceChargeType === "AMOUNT"
                    ? t("serviceChargeAmountHelper")
                    : t("serviceChargePercentageHelper")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section label={t("tableReservationSettings")}>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-[12px] border p-4">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {t("enableTableReservations")}
              </p>
              <p className="text-xs text-gray-500">
                {t("allowTableReservations")}
              </p>
            </div>

            <Switch
              checked={data.settings?.tableReservationsEnabled || false}
              onCheckedChange={(val) =>
                update(["settings", "tableReservationsEnabled"], val)
              }
            />
          </div>

          <div className="flex items-center justify-between rounded-[12px] border p-4">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {t("autoAcceptReservations")}
              </p>
              <p className="text-xs text-gray-500">
                {t("autoAcceptReservationsHelper")}
              </p>
            </div>

            <Switch
              checked={data.settings?.tableReservationAutoAccept || false}
              onCheckedChange={(val) =>
                update(["settings", "tableReservationAutoAccept"], val)
              }
            />
          </div>

          <div className="rounded-[12px] border p-4">
            <FormInput
              label={t("tableCount")}
              value={String(data.settings?.tableCount ?? 0)}
              onChange={(val) =>
                update(["settings", "tableCount"], val ? Number(val) : 0)
              }
            />
            <p className="mt-2 text-xs text-gray-500">
              {t("tableCountHelper")}
            </p>
          </div>
        </div>
      </Section>
    </div>
  );
}

export { EditBranchStepOne as default };
