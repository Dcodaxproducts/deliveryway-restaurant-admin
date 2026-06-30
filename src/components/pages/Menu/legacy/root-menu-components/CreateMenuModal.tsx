"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarClock, Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import FormInput from "@/components/forms/common/FormInput";
import { Time24Picker } from "@/components/ui/time-24-picker";
import AdminDealCategorySelector from "@/components/pages/Menu/deals/components/AdminDealCategorySelector";
import AdminDealMenuItemSelector from "@/components/pages/Menu/deals/components/AdminDealMenuItemSelector";
import type { MenuTimingDay, MenuTimingWindow } from "@/services/menus";
import type {
  AdminDealCategorySummary,
  AdminDealMenuItemSummary,
} from "@/types/admin-deals";

import { useCreateMenu, useGetMenuById, useUpdateMenu } from "@/hooks/useMenus";
import { useAuth } from "@/hooks/useAuth";
import { useTranslations } from "next-intl";

interface CreateMenuModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuId?: string;
}

const timingDays: MenuTimingDay[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const defaultTimingWindow: MenuTimingWindow = {
  day: "MONDAY",
  start: "08:00",
  end: "11:30",
};

const timezoneOptions = [
  { value: "Asia/Karachi", label: "Pakistan - Asia/Karachi" },
  { value: "Europe/Berlin", label: "Germany - Europe/Berlin" },
  { value: "UTC", label: "UTC" },
  { value: "Europe/London", label: "United Kingdom - Europe/London" },
  { value: "Europe/Paris", label: "France - Europe/Paris" },
  { value: "Europe/Madrid", label: "Spain - Europe/Madrid" },
  { value: "Europe/Rome", label: "Italy - Europe/Rome" },
  { value: "Europe/Amsterdam", label: "Netherlands - Europe/Amsterdam" },
  { value: "Europe/Zurich", label: "Switzerland - Europe/Zurich" },
  { value: "Asia/Dubai", label: "UAE - Asia/Dubai" },
  { value: "Asia/Riyadh", label: "Saudi Arabia - Asia/Riyadh" },
  { value: "Asia/Kolkata", label: "India - Asia/Kolkata" },
  { value: "Asia/Dhaka", label: "Bangladesh - Asia/Dhaka" },
  { value: "Asia/Singapore", label: "Singapore - Asia/Singapore" },
  { value: "Asia/Tokyo", label: "Japan - Asia/Tokyo" },
  { value: "America/New_York", label: "US Eastern - America/New_York" },
  { value: "America/Chicago", label: "US Central - America/Chicago" },
  { value: "America/Los_Angeles", label: "US Pacific - America/Los_Angeles" },
  { value: "Australia/Sydney", label: "Australia - Australia/Sydney" },
];

export default function CreateMenuModal({
  open,
  onOpenChange,
  menuId,
}: CreateMenuModalProps) {
  const t = useTranslations("menu.menuModal");
  const commonT = useTranslations("common");
  const isEdit = Boolean(menuId);

  const { user } = useAuth();
  const restaurantId = user?.restaurantId ?? undefined;
  const branchId = user?.branchId ?? undefined;
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    sortOrder: "",
    menuItemsIds: [] as string[],
    categoryIds: [] as string[],
    isTimed: false,
    timezone: "Asia/Karachi",
    timingWindows: [{ ...defaultTimingWindow }] as MenuTimingWindow[],
  });

  const [selectedMenuItems, setSelectedMenuItems] = useState<
    AdminDealMenuItemSummary[]
  >([]);
  const [selectedCategories, setSelectedCategories] = useState<
    AdminDealCategorySummary[]
  >([]);

  const { data: menuDetails, isLoading: loadingMenuDetails } = useGetMenuById(
    open && menuId ? menuId : undefined,
  );

  const createMenuMutation = useCreateMenu();
  const updateMenuMutation = useUpdateMenu();

  const creating = createMenuMutation.isPending || updateMenuMutation.isPending;

  useEffect(() => {
    if (!open) return;

    if (!isEdit) {
      handleReset();
      return;
    }

    const menu = menuDetails?.data;
    if (!menu) return;

    const mappedSelectedItems: AdminDealMenuItemSummary[] =
      menu?.items
        ?.map((entry: any) => {
          const item = entry?.menuItem || entry;
          const itemId = entry?.menuItemId || item?.id;

          if (!itemId) return null;

          return {
            id: itemId,
            name: item?.name || t("unnamedItem"),
            imageUrl: item?.imageUrl ?? null,
            basePrice: item?.basePrice ?? null,
            category: item?.category
              ? {
                  id: item.category.id,
                  name: item.category.name,
                }
              : null,
          };
        })
        .filter(
          (
            item: AdminDealMenuItemSummary | null,
          ): item is AdminDealMenuItemSummary => item !== null,
        ) || [];

    const mappedSelectedCategories: AdminDealCategorySummary[] =
      menu?.categories
        ?.map((entry: any) => {
          const category = entry?.menuCategory || entry;
          const categoryId = entry?.menuCategoryId || category?.id;

          if (!categoryId) return null;

          return {
            id: categoryId,
            name: category?.name || t("unnamedCategory"),
            imageUrl: category?.imageUrl ?? null,
            slug: category?.slug ?? null,
          };
        })
        .filter(
          (
            category: AdminDealCategorySummary | null,
          ): category is AdminDealCategorySummary => category !== null,
        ) || [];

    setForm({
      name: menu?.name || "",
      slug: menu?.slug || "",
      description: menu?.description || "",
      sortOrder: String(menu?.sortOrder ?? ""),
      menuItemsIds: mappedSelectedItems.map((item) => item.id),
      categoryIds: mappedSelectedCategories.map((category) => category.id),
      isTimed: Boolean(menu?.isTimed),
      timezone: menu?.timingConfig?.timezone || "Asia/Karachi",
      timingWindows:
        Array.isArray(menu?.timingConfig?.windows) &&
        menu.timingConfig.windows.length
          ? menu.timingConfig.windows.map(
              (window: Partial<MenuTimingWindow>) => ({
                day: timingDays.includes(window.day as MenuTimingDay)
                  ? (window.day as MenuTimingDay)
                  : "MONDAY",
                start: window.start || "08:00",
                end: window.end || "11:30",
              }),
            )
          : [{ ...defaultTimingWindow }],
    });

    setSelectedMenuItems(mappedSelectedItems);
    setSelectedCategories(mappedSelectedCategories);
  }, [open, isEdit, menuDetails, t]);

  const updateForm = (key: string, value: string) => {
    if (key === "name") {
      const slug = value
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, "");

      setForm((prev) => ({
        ...prev,
        name: value,
        slug,
      }));
      return;
    }

    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateTimedMenu = (checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      isTimed: checked,
      timingWindows: prev.timingWindows.length
        ? prev.timingWindows
        : [{ ...defaultTimingWindow }],
    }));
  };

  const updateTimingWindow = (
    index: number,
    key: keyof MenuTimingWindow,
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      timingWindows: prev.timingWindows.map((window, windowIndex) =>
        windowIndex === index
          ? {
              ...window,
              [key]: key === "day" ? (value as MenuTimingDay) : value,
            }
          : window,
      ),
    }));
  };

  const addTimingWindow = () => {
    setForm((prev) => ({
      ...prev,
      timingWindows: [...prev.timingWindows, { ...defaultTimingWindow }],
    }));
  };

  const removeTimingWindow = (index: number) => {
    setForm((prev) => ({
      ...prev,
      timingWindows: prev.timingWindows.filter(
        (_, windowIndex) => windowIndex !== index,
      ),
    }));
  };

  const handleMenuItemsChange = (itemIds: string[]) => {
    setForm((prev) => ({
      ...prev,
      menuItemsIds: itemIds,
    }));
  };

  const handleCategoriesChange = (categoryIds: string[]) => {
    setForm((prev) => ({
      ...prev,
      categoryIds,
    }));
  };

  const handleSubmit = async () => {
    setSubmitted(true);

    if (!form.name.trim()) {
      toast.error(t("nameRequired"));
      return;
    }

    const payload: any = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim(),
      sortOrder: Number(form.sortOrder) || 0,
      itemIds: form.menuItemsIds,
      categoryIds: form.categoryIds,
      isTimed: form.isTimed,
    };

    if (form.isTimed) {
      payload.timingConfig = {
        timezone: form.timezone.trim() || "Asia/Karachi",
        windows: form.timingWindows.map((window) => ({
          day: window.day,
          start: window.start,
          end: window.end,
        })),
      };
    }

    if (!isEdit) {
      payload.restaurantId = restaurantId;
    }

    try {
      if (isEdit && menuId) {
        await updateMenuMutation.mutateAsync({
          menuId,
          payload,
        });
        toast.success(t("updated"));
      } else {
        await createMenuMutation.mutateAsync(payload);
        toast.success(t("created"));
      }

      handleReset();
      onOpenChange(false);
      window.location.reload();
    } catch (err: any) {
      toast.error(err?.message || t("requestFailed"));
    }
  };

  const handleReset = () => {
    setForm({
      name: "",
      slug: "",
      description: "",
      sortOrder: "",
      menuItemsIds: [],
      categoryIds: [],
      isTimed: false,
      timezone: "Asia/Karachi",
      timingWindows: [{ ...defaultTimingWindow }],
    });
    setSelectedMenuItems([]);
    setSelectedCategories([]);
    setSubmitted(false);
  };

  const loadingInitialData = useMemo(() => {
    return open && isEdit && loadingMenuDetails;
  }, [open, isEdit, loadingMenuDetails]);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          handleReset();
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-w-[680px] rounded-[20px] p-6 bg-[#F5F5F5] max-h-[95vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            {isEdit ? t("editTitle") : t("createTitle")}
          </DialogTitle>
        </DialogHeader>

        {loadingInitialData ? (
          <div className="py-10 flex items-center justify-center">
            <Loader2 className="animate-spin" size={22} />
          </div>
        ) : (
          <>
            <div className="mt-5 rounded-[16px] bg-white p-5 space-y-4">
              <FormInput
                label={t("name")}
                placeholder={t("namePlaceholder")}
                value={form.name}
                onChange={(v) => updateForm("name", v)}
                required
                error={submitted && !form.name.trim()}
                errorText={t("nameRequired")}
              />

              <FormInput
                label={commonT("description")}
                placeholder={t("descriptionPlaceholder")}
                value={form.description}
                onChange={(v) => updateForm("description", v)}
              />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[16px] font-medium">{t("menuItems")}</p>
                  {!!form.menuItemsIds.length && (
                    <span className="text-xs font-medium text-primary bg-red-50 px-2 py-1 rounded-full">
                      {t("selectedCount", { count: form.menuItemsIds.length })}
                    </span>
                  )}
                </div>

                <AdminDealMenuItemSelector
                  value={form.menuItemsIds}
                  onChange={handleMenuItemsChange}
                  restaurantId={restaurantId}
                  initialItems={selectedMenuItems}
                  helpText={t("menuItemsHelp")}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[16px] font-medium">{t("categories")}</p>
                  {!!form.categoryIds.length && (
                    <span className="text-xs font-medium text-primary bg-red-50 px-2 py-1 rounded-full">
                      {t("selectedCount", { count: form.categoryIds.length })}
                    </span>
                  )}
                </div>

                <AdminDealCategorySelector
                  value={form.categoryIds}
                  onChange={handleCategoriesChange}
                  restaurantId={restaurantId}
                  branchId={branchId}
                  initialCategories={selectedCategories}
                  helpText={t("categoriesHelp")}
                />
              </div>

              <div className="rounded-[18px] border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-[14px] bg-primary/10 text-primary">
                      <CalendarClock size={19} />
                    </span>
                    <div>
                      <p className="text-[16px] font-semibold text-gray-950">
                        {t("timedMenu")}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-gray-500">
                        {t("timedMenuDescription")}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={form.isTimed}
                    onCheckedChange={updateTimedMenu}
                  />
                </div>

                {form.isTimed ? (
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {t("timezone")}
                      </label>
                      <Select
                        value={form.timezone}
                        onValueChange={(value) => updateForm("timezone", value)}
                      >
                        <SelectTrigger className="mt-2 h-[44px] min-w-0 rounded-[12px] border-gray-200 bg-white text-left text-sm font-semibold text-gray-900 shadow-none">
                          <SelectValue placeholder="Asia/Karachi" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[280px] min-w-[var(--radix-select-trigger-width)]">
                          {timezoneOptions.map((timezone) => (
                            <SelectItem
                              key={timezone.value}
                              value={timezone.value}
                            >
                              {timezone.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="mt-1 text-xs leading-5 text-gray-500">
                        {t("timezoneDescription")}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-950">
                            {t("scheduleWindows")}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-gray-500">
                            {t("scheduleWindowsDescription")}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addTimingWindow}
                          className="h-[38px] shrink-0 rounded-full border-primary bg-white px-3 text-xs font-semibold text-primary hover:bg-primary/5 hover:text-primary"
                        >
                          <Plus size={15} />
                          {t("addWindow")}
                        </Button>
                      </div>

                      {form.timingWindows.length ? (
                        form.timingWindows.map((window, index) => (
                          <div
                            key={`${window.day}-${index}`}
                            className="min-w-0 rounded-[14px] border border-gray-100 bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
                          >
                            <div className="flex min-w-0 items-end gap-3">
                              <div className="min-w-0 flex-1">
                                <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                                  {t("day")}
                                </label>
                                <select
                                  value={window.day}
                                  onChange={(event) =>
                                    updateTimingWindow(
                                      index,
                                      "day",
                                      event.target.value,
                                    )
                                  }
                                  className="mt-1 h-[42px] w-full min-w-0 rounded-[12px] border border-gray-200 bg-white px-3 text-sm font-semibold outline-none focus:border-primary"
                                >
                                  {timingDays.map((day) => (
                                    <option key={day} value={day}>
                                      {t(`days.${day}`)}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => removeTimingWindow(index)}
                                className="h-[42px] shrink-0 rounded-[12px] px-3 text-gray-400 hover:bg-red-50 hover:text-primary"
                                aria-label={t("removeWindow")}
                              >
                                <Trash2 size={17} />
                              </Button>
                            </div>

                            <div className="mt-3 grid min-w-0 gap-3 sm:grid-cols-2">
                              <div className="min-w-0">
                                <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                                  {t("startTime")}
                                </label>
                                <Time24Picker
                                  value={window.start}
                                  onChange={(value) =>
                                    updateTimingWindow(index, "start", value)
                                  }
                                  className="mt-1 h-[42px] w-full min-w-0 rounded-[12px] border border-gray-200 bg-white px-3 text-sm font-semibold outline-none focus-within:border-primary"
                                />
                              </div>

                              <div className="min-w-0">
                                <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                                  {t("endTime")}
                                </label>
                                <Time24Picker
                                  value={window.end}
                                  onChange={(value) =>
                                    updateTimingWindow(index, "end", value)
                                  }
                                  className="mt-1 h-[42px] w-full min-w-0 rounded-[12px] border border-gray-200 bg-white px-3 text-sm font-semibold outline-none focus-within:border-primary"
                                />
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-[14px] border border-dashed border-gray-200 bg-white px-4 py-5 text-center">
                          <p className="text-sm font-semibold text-gray-900">
                            {t("noWindowsTitle")}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-gray-500">
                            {t("noWindowsDescription")}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-5 flex justify-center gap-4">
              <Button
                variant="ghost"
                onClick={handleReset}
                className="text-gray-700 text-[17px]"
                disabled={creating}
              >
                {commonT("reset")}
              </Button>

              <Button
                onClick={handleSubmit}
                disabled={creating}
                className="px-8 py-0 rounded-[10px] bg-primary hover:bg-primary/90 text-[17px] text-white"
              >
                {creating ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={16} />
                    {isEdit ? commonT("updating") : t("creating")}
                  </>
                ) : isEdit ? (
                  t("update")
                ) : (
                  commonT("create")
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
