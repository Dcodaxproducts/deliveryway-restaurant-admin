"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CalendarClock, Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import FormInput from "@/components/forms/common/FormInput";
import AsyncMultiSelect from "@/components/ui/AsyncMultiSelect";
import type { MenuTimingDay, MenuTimingWindow } from "@/services/menus";

// update these imports according to your actual paths
import {
  useCreateMenu,
  useGetMenuById,
  useUpdateMenu,
} from "@/hooks/useMenus";
import { getMenuItems } from "@/services/menu/menu.api";
import { useAuth } from "@/hooks/useAuth";
import { useTranslations } from "next-intl";

interface CreateMenuModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuId?: string;
}

interface MenuItemOption {
  id: string;
  name: string;
  [key: string]: any;
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
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    sortOrder: "",
    menuItemsIds: [] as string[],
    isTimed: false,
    timezone: "Asia/Karachi",
    timingWindows: [{ ...defaultTimingWindow }] as MenuTimingWindow[],
  });

  const [selectedMenuItems, setSelectedMenuItems] = useState<MenuItemOption[]>(
    []
  );

  const { data: menuDetails, isLoading: loadingMenuDetails } = useGetMenuById(
    open && menuId ? menuId : undefined
  );

  const createMenuMutation = useCreateMenu();
  const updateMenuMutation = useUpdateMenu();

  const creating =
    createMenuMutation.isPending || updateMenuMutation.isPending;


  useEffect(() => {
    if (!open) return;

    if (!isEdit) {
      handleReset();
      return;
    }

    const menu = menuDetails?.data;
    if (!menu) return;

    const mappedSelectedItems: MenuItemOption[] =
      menu?.items
        ?.map((entry: any) => {
          const item = entry?.menuItem || entry;
          const itemId = entry?.menuItemId || item?.id;

          if (!itemId) return null;

          return {
            id: itemId,
            name: item?.name || t("unnamedItem"),
            ...item,
          };
        })
        .filter(Boolean) || [];

    setForm({
      name: menu?.name || "",
      slug: menu?.slug || "",
      description: menu?.description || "",
      sortOrder: String(menu?.sortOrder ?? ""),
      menuItemsIds: mappedSelectedItems.map((item) => item.id),
      isTimed: Boolean(menu?.isTimed),
      timezone: menu?.timingConfig?.timezone || "Asia/Karachi",
      timingWindows: Array.isArray(menu?.timingConfig?.windows) && menu.timingConfig.windows.length
        ? menu.timingConfig.windows.map((window: Partial<MenuTimingWindow>) => ({
            day: timingDays.includes(window.day as MenuTimingDay)
              ? window.day as MenuTimingDay
              : "MONDAY",
            start: window.start || "08:00",
            end: window.end || "11:30",
          }))
        : [{ ...defaultTimingWindow }],
    });

    setSelectedMenuItems(mappedSelectedItems);
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
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      timingWindows: prev.timingWindows.map((window, windowIndex) => (
        windowIndex === index
          ? { ...window, [key]: key === "day" ? value as MenuTimingDay : value }
          : window
      )),
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
      timingWindows: prev.timingWindows.filter((_, windowIndex) => windowIndex !== index),
    }));
  };


  const fetchMenuItemOptions = async ({
    search,
    page,
  }: {
    search: string;
    page: number;
  }) => {
    if (!restaurantId) {
      return { data: [], meta: undefined };
    }

    try {
     const res = await getMenuItems({
  page,
  limit: 10,
  search: search || undefined,
  restaurantId,
});
      return {
        data: Array.isArray(res?.data) ? res.data : [],
        meta: res?.meta,
      };
    } catch {
      toast.error(t("loadMenuItemsError"));
      return { data: [], meta: undefined };
    }
  };


  const handleMenuItemsChange = (items: MenuItemOption[]) => {
    setSelectedMenuItems(items);
    setForm((prev) => ({
      ...prev,
      menuItemsIds: items.map((item) => item.id),
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
      isTimed: false,
      timezone: "Asia/Karachi",
      timingWindows: [{ ...defaultTimingWindow }],
    });
    setSelectedMenuItems([]);
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
      <DialogContent className="max-w-[680px] rounded-[20px] p-6 bg-[#F5F5F5] max-h-[95vh] overflow-auto">
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
                label={commonT("slug")}
                placeholder={t("slugPlaceholder")}
                value={form.slug}
                onChange={(v) => updateForm("slug", v)}
              />

              <FormInput
                label={commonT("description")}
                placeholder={t("descriptionPlaceholder")}
                value={form.description}
                onChange={(v) => updateForm("description", v)}
              />

              <FormInput
                label={t("sortOrder")}
                placeholder={t("sortOrderPlaceholder")}
                value={form.sortOrder}
                onChange={(v) => updateForm("sortOrder", v)}
              />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[16px] font-medium">{t("menuItems")}</p>
                  {!!selectedMenuItems.length && (
                    <span className="text-xs font-medium text-primary bg-red-50 px-2 py-1 rounded-full">
                      {t("selectedCount", { count: selectedMenuItems.length })}
                    </span>
                  )}
                </div>

                <AsyncMultiSelect
                  value={selectedMenuItems}
                  onChange={handleMenuItemsChange}
                  placeholder={t("selectMenuItemsPlaceholder")}
                  fetchOptions={fetchMenuItemOptions}
                  labelKey="name"
                  valueKey="id"
                  maxSelectedLabelCount={2}
                  closeOnSelect={false}
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
                  <Switch checked={form.isTimed} onCheckedChange={updateTimedMenu} />
                </div>

                {form.isTimed ? (
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {t("timezone")}
                      </label>
                      <input
                        value={form.timezone}
                        onChange={(event) => updateForm("timezone", event.target.value)}
                        placeholder="Asia/Karachi"
                        className="mt-2 h-[44px] w-full rounded-[12px] border border-gray-200 bg-white px-3 text-sm font-medium outline-none transition focus:border-primary"
                      />
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
                            className="grid gap-3 rounded-[14px] border border-gray-100 bg-white p-3 sm:grid-cols-[1.1fr_1fr_1fr_auto]"
                          >
                            <div>
                              <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                                {t("day")}
                              </label>
                              <select
                                value={window.day}
                                onChange={(event) => updateTimingWindow(index, "day", event.target.value)}
                                className="mt-1 h-[42px] w-full rounded-[12px] border border-gray-200 bg-white px-3 text-sm font-semibold outline-none focus:border-primary"
                              >
                                {timingDays.map((day) => (
                                  <option key={day} value={day}>
                                    {t(`days.${day}`)}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                                {t("startTime")}
                              </label>
                              <input
                                type="time"
                                value={window.start}
                                onChange={(event) => updateTimingWindow(index, "start", event.target.value)}
                                className="mt-1 h-[42px] w-full rounded-[12px] border border-gray-200 bg-white px-3 text-sm font-semibold outline-none focus:border-primary"
                              />
                            </div>

                            <div>
                              <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                                {t("endTime")}
                              </label>
                              <input
                                type="time"
                                value={window.end}
                                onChange={(event) => updateTimingWindow(index, "end", event.target.value)}
                                className="mt-1 h-[42px] w-full rounded-[12px] border border-gray-200 bg-white px-3 text-sm font-semibold outline-none focus:border-primary"
                              />
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => removeTimingWindow(index)}
                              className="h-[42px] self-end rounded-[12px] px-3 text-gray-400 hover:bg-red-50 hover:text-primary"
                              aria-label={t("removeWindow")}
                            >
                              <Trash2 size={17} />
                            </Button>
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
