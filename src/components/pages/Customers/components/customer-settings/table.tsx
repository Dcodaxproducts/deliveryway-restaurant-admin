"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import SortableHeader from "@/components/common/sortable-head";
import { Eye, MoreHorizontal } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import { useState, useEffect } from "react"; //  added useEffect
import CustomerDetailModal from "./CustomerDetailModal";
import PaginationSection from "@/components/common/PaginationSection";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AddCustomerModal from "./AddCustomerModal";
import {
  useDeleteCustomer,
  useUpdateCustomerStatus,
} from "@/hooks/useCustomers";
import { useTranslations } from "next-intl";

interface Customer {
  id: string;
  email?: string;
  isActive?: boolean;
  createdAt?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
  _count?: {
    customerOrders?: number;
  };
}

interface Props {
  customers?: Customer[];
  loading?: boolean;
  meta?: any;
  onPageChange?: (page: number) => void;
  onRefresh?: () => void;
}
const CustomerTable = ({
  customers = [],
  loading = false,
  meta,
  onPageChange = () => undefined,
  onRefresh = () => undefined,
}: Props) => {
  const t = useTranslations("customers");
  const commonT = useTranslations("common");
  const [openDetails, setOpenDetails] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

  const [localCustomers, setLocalCustomers] = useState<Customer[]>(customers);

  useEffect(() => {
    setLocalCustomers(customers);
  }, [customers]);

  const deleteCustomerMutation = useDeleteCustomer({
    messages: {
      success: t("messages.deleted"),
      error: t("messages.failedDelete"),
    },
  });
  const updateCustomerStatusMutation = useUpdateCustomerStatus({
    messages: {
      success: t("messages.statusUpdated"),
      error: t("messages.failedStatusUpdate"),
    },
  });

  const handleDelete = async (id?: string) => {
    if (!id) return;

    try {
      await deleteCustomerMutation.mutateAsync(id);

      // instant UI update
      setLocalCustomers((prev) => prev.filter((c) => c.id !== id));

      // sync from server
      onRefresh();
    } catch {
      // toast already handled in hook
    }
  };

  const handleToggleStatus = async (id: string, current: boolean) => {
    // optimistic UI update
    setLocalCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isActive: !current } : c)),
    );

    try {
      await updateCustomerStatusMutation.mutateAsync({
        id,
        isActive: !current,
      });

      onRefresh();
    } catch {
      // rollback
      setLocalCustomers((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isActive: current } : c)),
      );
    }
  };

  if (loading) {
    return (
      <div className="text-sm text-gray-400 py-10 text-center">
        {t("loading")}
      </div>
    );
  }

  if (!localCustomers || localCustomers.length === 0) {
    return (
      <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
    );
  }

  return (
    <>
      {/* -------- Desktop -------- */}
      <div className="hidden md:block">
        <Table className="my-10">
          <TableHeader>
            <TableRow className="border-none">
              <TableHead className="w-[50px]">
                <Checkbox />
              </TableHead>

              <SortableHeader label={t("table.serial")} />
              <SortableHeader label={t("table.customerName")} />
              <SortableHeader label={t("table.customerInfo")} />

              <TableHead className="text-center px-4 font-semibold">
                {t("table.totalOrder")}
              </TableHead>

              <SortableHeader label={t("table.joiningDate")} />
              <SortableHeader label={t("table.blockToggle")} />

              <TableHead className="text-center font-semibold">
                {commonT("actions")}
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {localCustomers.map((c, i) => {
              //  CHANGED
              const fullName = `${c.profile?.firstName || ""} ${
                c.profile?.lastName || ""
              }`;

              return (
                <TableRow key={c.id} className="border-none h-[70px]">
                  <TableCell>
                    <Checkbox />
                  </TableCell>

                  <TableCell className="px-4">
                    {(meta?.page - 1) * (meta?.limit || 10) + i + 1}
                  </TableCell>

                  <TableCell className="px-4">{fullName || "-"}</TableCell>

                  <TableCell className="px-4">
                    <div>
                      <p>{c.profile?.phone || "-"}</p>
                      <p className="text-gray max-w-[180px] truncate">
                        {c.email}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell className="px-4 text-center">
                    {c._count?.customerOrders || 0}
                  </TableCell>

                  <TableCell className="px-4">
                    {c.createdAt
                      ? new Date(c.createdAt).toLocaleDateString()
                      : "-"}
                  </TableCell>

                  <TableCell className="text-center pr-14">
                    <Switch
                      checked={!!c.isActive} //  ensure boolean
                      onCheckedChange={() =>
                        handleToggleStatus(c.id, !!c.isActive)
                      }
                    />
                  </TableCell>

                  <TableCell className="px-4">
                    <div className="flex items-center justify-center gap-2 text-gray">
                      <button
                        className="p-2"
                        onClick={() => {
                          setSelectedCustomer(c);
                          setOpenDetails(true);
                        }}
                      >
                        <Eye size={18} />
                      </button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2">
                            <MoreHorizontal size={18} />
                          </button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedCustomer(c);
                              setOpenEdit(true);
                            }}
                          >
                            {commonT("edit")}
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDelete(c.id)}
                          >
                            {commonT("delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <PaginationSection meta={meta} onPageChange={onPageChange} />
      </div>

      {/* -------- Mobile -------- */}
      <div className="flex flex-col gap-4 md:hidden">
        {localCustomers.map((c) => {
          //  CHANGED
          const fullName = `${c.profile?.firstName || ""} ${
            c.profile?.lastName || ""
          }`;

          return (
            <div
              key={c.id}
              className="bg-white rounded-[18px] p-4 shadow-sm border"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Checkbox />
                  <p className="font-medium">{fullName}</p>
                </div>

                <Switch
                  checked={!!c.isActive}
                  onCheckedChange={() => handleToggleStatus(c.id, !!c.isActive)}
                />
              </div>

              <div className="text-sm text-gray mb-2">
                <p>
                  {t("table.phone")}: {c.profile?.phone || "-"}
                </p>
                <p className="max-w-[210px] truncate">
                  {t("table.email")}: {c.email}
                </p>
              </div>

              <div className="text-sm text-gray mb-2">
                <p>
                  {t("table.totalOrders")}: {c._count?.customerOrders || 0}
                </p>
                <p>
                  {t("table.joined")}:{" "}
                  {c.createdAt
                    ? new Date(c.createdAt).toLocaleDateString()
                    : "-"}
                </p>
              </div>

              <div className="flex justify-end gap-2 text-gray">
                <button
                  className="p-2"
                  onClick={() => {
                    setSelectedCustomer(c);
                    setOpenDetails(true);
                  }}
                >
                  <Eye size={18} />
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-2">
                      <MoreHorizontal size={18} />
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedCustomer(c);
                        setOpenEdit(true);
                      }}
                    >
                      {commonT("edit")}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => handleDelete(c.id)}
                    >
                      {commonT("delete")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}

        <PaginationSection meta={meta} onPageChange={onPageChange} />

        <CustomerDetailModal
          open={openDetails}
          onOpenChange={setOpenDetails}
          customer={selectedCustomer}
        />
        <AddCustomerModal
          open={openEdit}
          onOpenChange={setOpenEdit}
          initialData={selectedCustomer} // <-- IMPORTANT (you can handle inside modal)
          onSuccess={onRefresh}
        />
      </div>
    </>
  );
};

export default CustomerTable;
