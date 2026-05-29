"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import FormInput from "@/components/forms/common/FormInput";
import AsyncMultiSelect from "@/components/ui/AsyncMultiSelect";

// update these imports according to your actual paths
import {
  useCreateMenu,
  useGetMenuById,
  useUpdateMenu,
} from "@/hooks/useMenus";
import { getMenuItems } from "@/services/menu/menu.api";
import { useAuth } from "@/hooks/useAuth";

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

export default function CreateMenuModal({
  open,
  onOpenChange,
  menuId,
}: CreateMenuModalProps) {
  const isEdit = Boolean(menuId);

  const { user, token } = useAuth();
  const restaurantId = user?.restaurantId ?? undefined;
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    sortOrder: "",
    menuItemsIds: [] as string[],
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
            name: item?.name || "Unnamed Item",
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
    });

    setSelectedMenuItems(mappedSelectedItems);
  }, [open, isEdit, menuDetails]);


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
    } catch (error) {
      toast.error("Failed to load menu items");
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
      toast.error("Menu name required");
      return;
    }

    const payload: any = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim(),
      sortOrder: Number(form.sortOrder) || 0,
      itemIds: form.menuItemsIds,
    };

    if (!isEdit) {
      payload.restaurantId = restaurantId;
    }

    try {
      if (isEdit && menuId) {
        await updateMenuMutation.mutateAsync({
          menuId,
          payload,
        });
        toast.success("Menu updated");
      } else {
        await createMenuMutation.mutateAsync(payload);
        toast.success("Menu created");
      }

      handleReset();
      onOpenChange(false);
      window.location.reload();
    } catch (err: any) {
      toast.error(err?.message || "Request failed");
    }
  };


  const handleReset = () => {
    setForm({
      name: "",
      slug: "",
      description: "",
      sortOrder: "",
      menuItemsIds: [],
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
      <DialogContent className="max-w-[420px] rounded-[20px] p-6 bg-[#F5F5F5] max-h-[95vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            {isEdit ? "Edit Menu" : "Create Menu"}
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
                label="Menu Name"
                placeholder="e.g Lunch Menu"
                value={form.name}
                onChange={(v) => updateForm("name", v)}
                required
                error={submitted && !form.name.trim()}
                errorText="Menu name required"
              />

              <FormInput
                label="Slug"
                placeholder="auto-generated"
                value={form.slug}
                onChange={(v) => updateForm("slug", v)}
              />

              <FormInput
                label="Description"
                placeholder="Menu description"
                value={form.description}
                onChange={(v) => updateForm("description", v)}
              />

              <FormInput
                label="Sort Order"
                placeholder="e.g 1"
                value={form.sortOrder}
                onChange={(v) => updateForm("sortOrder", v)}
              />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[16px] font-medium">Menu Items</p>
                  {!!selectedMenuItems.length && (
                    <span className="text-xs font-medium text-primary bg-red-50 px-2 py-1 rounded-full">
                      {selectedMenuItems.length} selected
                    </span>
                  )}
                </div>

                <AsyncMultiSelect
                  value={selectedMenuItems}
                  onChange={handleMenuItemsChange}
                  placeholder="Search and select menu items"
                  fetchOptions={fetchMenuItemOptions}
                  labelKey="name"
                  valueKey="id"
                  maxSelectedLabelCount={2}
                  closeOnSelect={false}
                />
              </div>
            </div>

            <div className="mt-5 flex justify-center gap-4">
              <Button
                variant="ghost"
                onClick={handleReset}
                className="text-gray-700 text-[17px]"
                disabled={creating}
              >
                Reset
              </Button>

              <Button
                onClick={handleSubmit}
                disabled={creating}
                className="px-8 py-0 rounded-[10px] bg-primary hover:bg-primary/90 text-[17px] text-white"
              >
                {creating ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={16} />
                    {isEdit ? "Updating..." : "Creating..."}
                  </>
                ) : isEdit ? (
                  "Update"
                ) : (
                  "Create"
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
