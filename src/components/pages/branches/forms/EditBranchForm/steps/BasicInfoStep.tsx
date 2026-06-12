"use client";

import type { Dispatch, SetStateAction } from "react";

import FormInput from "@/components/forms/common/FormInput";
import {
  BranchLocationPicker,
  type BranchLocationAddressFields,
} from "@/components/pages/Branches/components/BranchLocationPicker";
import Section from "@/components/pages/Promotions/forms/Section";
import ImageDropzoneUpload from "@/components/ui/ImageDropzoneUpload";
import { Switch } from "@/components/ui/switch";
import type { BranchFormData } from "@/components/pages/branches/forms/EditBranchForm/types";
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

  const addressLatitude = toCoordinate(data.lat);
  const addressLongitude = toCoordinate(data.lng);
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
      update([fieldName], value);
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
            value={data.street || ""}
            onChange={(val) => update(["street"], val)}
          />

          <FormInput
            label={t("shopNumber")}
            value={data.shopNumber || ""}
            onChange={(val) => update(["shopNumber"], val)}
          />

          <FormInput
            label={t("postalCode")}
            value={data.postalCode || ""}
            onChange={(val) => update(["postalCode"], val)}
          />

          <FormInput
            label={t("city")}
            value={data.city || ""}
            onChange={(val) => update(["city"], val)}
          />

          <FormInput
            label={t("area")}
            value={data.area || ""}
            onChange={(val) => update(["area"], val)}
          />

          <FormInput
            label={t("state")}
            value={data.state || ""}
            onChange={(val) => update(["state"], val)}
          />

          <FormInput
            label={t("country")}
            value={data.country || ""}
            onChange={(val) => update(["country"], val)}
          />

          <FormInput
            label={t("latitude")}
            value={data.lat === undefined ? "" : String(data.lat)}
            onChange={(val) => update(["lat"], val)}
          />

          <FormInput
            label={t("longitude")}
            value={data.lng === undefined ? "" : String(data.lng)}
            onChange={(val) => update(["lng"], val)}
          />
        </div>
      </Section>

      <Section label={t("branchMedia")}>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <ImageDropzoneUpload
            label={t("logo")}
            value={data.logoUrl || ""}
            previewAlt={t("logo")}
            onChange={(fileUrl) => update(["logoUrl"], fileUrl)}
            onClear={() => update(["logoUrl"], "")}
            emptyTitle={t("uploadLogo")}
            helperText={t("squareImageRecommended")}
            uploadedTitle={t("logo")}
            replaceHint={t("replaceLogo")}
            previewHeightClassName="h-40"
          />

          <ImageDropzoneUpload
            label={t("coverImage")}
            value={data.coverImage || ""}
            previewAlt={t("coverImage")}
            onChange={(fileUrl) => update(["coverImage"], fileUrl)}
            onClear={() => update(["coverImage"], "")}
            emptyTitle={t("uploadCover")}
            uploadedTitle={t("coverImage")}
            replaceHint={t("changeCover")}
            previewHeightClassName="h-40"
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
