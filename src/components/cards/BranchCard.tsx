"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CalendarDays,
  Eye,
  Image as ImageIcon,
  Store,
  List,
  Trash,
  Loader2,
  Power,
  PauseCircle,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BranchProps } from "@/types/branch";
import ActionDropdown, { type ActionDropdownItem } from "../common/ActionDropdown";
import OpeningHoursModal from "@/components/pages/Branches/components/OpeningHoursModal";
import { AddHolidayHoursInfo } from "@/components/pages/Branches/components/AddHolidayHoursInfo";
import DeliveryHoursModal from "@/components/pages/Branches/components/DeliveryHoursModal";

import {
  useDeleteBranch,
  useActivateBranch,
  useSuspendBranch,
  useUpdateBranchTemporaryClosure,
} from "@/hooks/useBranches";
import { useDeleteRestaurantMenu } from "@/hooks/useMenus";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import DeleteDialog from "@/components/common/dialogs/delete-dialog";
import BranchCoverModal from "@/components/pages/Branches/components/BranchCoverModal";
import TemporaryBranchClosureModal from "./TemporaryBranchClosureModal";
import { useTranslations } from "next-intl";
import { getApiErrorMessage } from "@/lib/errors";

export function BranchCard({
  id,
  name,
  isDefault,
  isTimed,
  itemsCount,
  isActive,
  availability,
  openDialog,
  openMenuDetails,
  editMenu,
  loading,
  coverImage,
  logoUrl,
  allowDelete = true,
  allowLifecycleActions = true,
  branchAdminMode = false,
  showMediaActions = true,
}: BranchProps & { loading?: boolean }) {
  const t = useTranslations("branches");
  const commonT = useTranslations("common");
  const [openingHoursOpen, setOpeningHoursOpen] = useState(false);
  const [deliveryHoursOpen, setDeliveryHoursOpen] = useState(false);
  const [holidayHoursOpen, setHolidayHoursOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [coverModalOpen, setCoverModalOpen] = useState(false);
  const [temporaryClosureOpen, setTemporaryClosureOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteMutation = useDeleteBranch();
  const activateMutation = useActivateBranch();
  const suspendMutation = useSuspendBranch();
  const temporaryClosureMutation = useUpdateBranchTemporaryClosure();
  const deleteMenuMutation = useDeleteRestaurantMenu();

  const { isBranchAdmin, loading: authLoading } = useAuth();

  const isTemporarilyClosed = Boolean(
    availability?.isTemporarilyClosed ||
      availability?.temporaryClosure?.isClosed
  );

  const iconMap = [
    { key: "menu", icon: List },
    { key: "branch", icon: Store },
  ];

  const Icon =
    iconMap.find(({ key }) => name?.toLowerCase().includes(key))?.icon ||
    Store;

  const isBranchEntity = Boolean(openDialog) || branchAdminMode;
  const canDelete = allowDelete && !authLoading && !isBranchAdmin;
  const canUseLifecycleActions = allowLifecycleActions && !authLoading && !isBranchAdmin;
  const canUseMediaActions = isBranchEntity && showMediaActions;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);

      if (openDialog) {
        await deleteMutation.mutateAsync(id);
      } else {
        await deleteMenuMutation.mutateAsync(id);
        window.location.reload();
      }

      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("failedToDelete")));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReopenTemporaryClosure = async () => {
    if (!isTemporarilyClosed) return;

    try {
      await temporaryClosureMutation.mutateAsync({
        id,
        payload: {
          isClosed: false,
        },
      });

      window.location.reload();
    } catch (err) {
      void err;
    }
  };

  const handleActivate = async () => {
    if (isActive) return;

    try {
      await activateMutation.mutateAsync(id);
    } catch (error) {
      void error;
    }
  };

  const handleSuspend = async () => {
    if (!isActive) return;

    try {
      await suspendMutation.mutateAsync(id);
    } catch (error) {
      void error;
    }
  };

  const dropdownItems = (
    [
    isBranchEntity
      ? {
          label: t("editBranch"),
          href: `/branches/edit?branchId=${id}`,
          icon: <Store size={16} />,
        }
      : !isBranchAdmin && editMenu
      ? {
          label: t("editMenu"),
          onClick: () => editMenu?.(id),
          icon: <List size={16} />,
        }
      : openMenuDetails
      ? {
          label: t("viewMenuItems"),
          onClick: () => openMenuDetails?.(id),
          icon: <List size={16} />,
        }
      : null,

    ...(isBranchEntity
      ? [
          {
            label: t("openingHours"),
            onClick: () => setOpeningHoursOpen(true),
            icon: <Store size={16} />,
          },
          {
            label: t("deliveryHours"),
            onClick: () => setDeliveryHoursOpen(true),
            icon: <Truck size={16} />,
          },
          {
            label: t("holidayHours"),
            onClick: () => setHolidayHoursOpen(true),
            icon: <CalendarDays size={16} />,
          },
          {
            label: isTemporarilyClosed
              ? t("alreadyTemporarilyClosed")
              : t("temporaryClosure"),
            onClick: !isTemporarilyClosed
              ? () => setTemporaryClosureOpen(true)
              : undefined,
            className: isTemporarilyClosed
              ? "opacity-50 pointer-events-none"
              : "",
            icon: <PauseCircle size={16} />,
          },
          {
            label: t("reopenBranch"),
            onClick: isTemporarilyClosed
              ? handleReopenTemporaryClosure
              : undefined,
            className: !isTemporarilyClosed
              ? "opacity-50 pointer-events-none"
              : "",
            icon: temporaryClosureMutation.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Power size={16} />
            ),
          },
          ...(canUseLifecycleActions
            ? [
                {
                  label: t("activate"),
                  onClick: !isActive ? handleActivate : undefined,
                  className: isActive ? "opacity-50 pointer-events-none" : "",
                  icon: <Power size={16} />,
                },
                {
                  label: t("suspend"),
                  onClick: isActive ? handleSuspend : undefined,
                  className: !isActive ? "opacity-50 pointer-events-none" : "",
                  icon: <PauseCircle size={16} />,
                },
              ]
            : []),
        ]
      : []),

    ...(canDelete
      ? [
          {
            label: commonT("delete"),
            onClick: () => setDeleteDialogOpen(true),
            icon: <Trash size={16} className="text-red-500" />,
          },
        ]
      : []),
    ] as Array<ActionDropdownItem | null>
  ).filter((item): item is ActionDropdownItem => Boolean(item));

  if (loading) {
    return (
      <div className="flex items-center justify-between bg-white rounded-[14px] border border-gray-200 px-4 py-4 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="size-4 bg-gray-200 rounded" />
          <div className="size-10 bg-gray-200 rounded-lg" />
          <div className="space-y-2">
            <div className="h-3 w-[120px] bg-gray-200 rounded" />
            <div className="h-2 w-[80px] bg-gray-200 rounded" />
          </div>
        </div>

        <div className="flex gap-2">
          <div className="h-8 w-8 bg-gray-200 rounded" />
          <div className="h-8 w-8 bg-gray-200 rounded" />
          <div className="h-8 w-8 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        bg-white rounded-[14px] border border-gray-200
        p-4 transition
        ${typeof isActive === "boolean" && !isActive ? "opacity-60" : ""}
      `}
    >
      <div className="flex flex-col gap-3 lg:hidden">
        <div className="flex items-center gap-3">
          <Checkbox
            defaultChecked
            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />

          <div className="size-10 rounded-lg bg-[#F4F6FA] flex items-center justify-center shrink-0">
            <Icon size={20} className="text-gray-500" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-semibold truncate">{name}</h4>

              {isDefault && (
                <span className="text-[11px] font-medium text-green-600 bg-green-50 px-2 py-[2px] rounded-full">
                  {t("main")}
                </span>
              )}

              {isTimed && (
                <span className="text-[11px] font-medium text-primary bg-primary/10 px-2 py-[2px] rounded-full">
                  {t("timedMenu")}
                </span>
              )}

              {isTemporarilyClosed && (
                <span className="text-[11px] font-medium text-primary bg-primary/10 px-2 py-[2px] rounded-full">
                  {t("temporarilyClosed")}
                </span>
              )}
            </div>

            <p className="text-xs text-gray-400 mt-1">
              {t("id")}: #{id} • {t("itemsCount", { count: itemsCount ?? 0 })}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-2">
            {(openDialog || openMenuDetails) && (
              <ActionButton
                onClick={() =>
                  openDialog ? openDialog(id) : openMenuDetails?.(id)
                }
              >
                <Eye size={18} />
              </ActionButton>
            )}

            {canUseMediaActions && (
              <ActionButton onClick={() => setCoverModalOpen(true)}>
                <ImageIcon size={18} />
              </ActionButton>
            )}
          </div>

          {dropdownItems.length > 0 ? <ActionDropdown items={dropdownItems} /> : null}
        </div>
      </div>

      <div className="hidden lg:flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <Checkbox
            defaultChecked
            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />

          <div className="size-10 rounded-lg bg-[#F4F6FA] flex items-center justify-center">
            <Icon size={20} className="text-gray-500" />
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-base font-semibold truncate">{name}</h4>

              {isDefault && (
                <div className="flex items-center">
                  <span className="size-2 rounded-full bg-green-500" />
                  <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-[2px] rounded-full whitespace-nowrap">
                    {t("main")}
                  </span>
                </div>
              )}

              {isTimed && (
                <span className="text-[11px] font-medium text-primary bg-primary/10 px-2 py-[2px] rounded-full">
                  {t("timedMenu")}
                </span>
              )}

              {isTemporarilyClosed && (
                <span className="text-[11px] font-medium text-primary bg-primary/10 px-2 py-[2px] rounded-full">
                  {t("temporarilyClosed")}
                </span>
              )}
            </div>

            <p className="text-sm text-gray-400">
              {t("id")}: #{id} | {t("itemsCount", { count: itemsCount ?? 0 })}
            </p>
          </div>
        </div>

        <div className="flex items-center border border-gray-200 rounded-[10px] overflow-hidden">
          {openDialog && (
            <>
              <ActionButton onClick={() => openDialog(id)}>
                <Eye size={18} />
              </ActionButton>
              <Divider />
            </>
          )}

          {openMenuDetails && (
            <>
              <ActionButton onClick={() => openMenuDetails(id)}>
                <Eye size={18} />
              </ActionButton>
              <Divider />
            </>
          )}

          {canUseMediaActions && (
            <>
              <ActionButton onClick={() => setCoverModalOpen(true)}>
                <ImageIcon size={18} />
              </ActionButton>
              <Divider />
            </>
          )}

          {dropdownItems.length > 0 ? <ActionDropdown items={dropdownItems} /> : null}
        </div>
      </div>

      <OpeningHoursModal
        open={openingHoursOpen}
        onOpenChange={setOpeningHoursOpen}
        branchId={id}
        branchName={name}
      />

      <DeliveryHoursModal
        open={deliveryHoursOpen}
        onOpenChange={setDeliveryHoursOpen}
        branchId={id}
        branchName={name}
      />

      <AddHolidayHoursInfo
        open={holidayHoursOpen}
        onOpenChange={setHolidayHoursOpen}
        branchId={id}
        branchName={name}
      />

      <TemporaryBranchClosureModal
        open={temporaryClosureOpen}
        onOpenChange={setTemporaryClosureOpen}
        branchId={id}
        branchName={name}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        isLoading={isDeleting || deleteMutation.isPending}
        title={openDialog ? t("deleteBranch") : t("deleteMenu")}
        description={t("deleteDescription", { name })}
      />

      <BranchCoverModal
        open={coverModalOpen}
        onOpenChange={setCoverModalOpen}
        branchId={id}
        branchName={name}
        coverImage={coverImage}
        logoUrl={logoUrl}
      />
    </div>
  );
}

function ActionButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <Button
      variant="ghost"
      className="h-[40px] w-[44px] flex items-center justify-center text-gray-500 hover:bg-gray-50"
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function Divider() {
  return <div className="w-[1px] h-[38px] bg-gray-200" />;
}
