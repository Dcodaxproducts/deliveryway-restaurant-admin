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
import { ClipboardList, Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import EmptyState from "../common/EmptyState";
import DeliveryManDetails from "./DeliveryManDetails";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import PaginationSection from "../pagination";
import { useRouter } from "next/navigation";

import {
  useUpdateDeliverymanStatus,
  useDeleteDeliveryman,
} from "@/hooks/useDeliverymen";
import AssignOrderModal from "./AssignOrderModal";

interface Props {
  data?: any[];
  meta?: any;
  onPageChange?: (page: number) => void;
  refresh?: () => void;
  loading?: boolean;
}

const DeliveryManTable = ({
  data = [],
  meta,
  onPageChange = () => undefined,
  refresh = () => undefined,
  loading = false,
}: Props) => {
  const [openDetails, setOpenDetails] = useState(false);
  const [selected, setSelected] = useState<any>(null);
const [openAssignOrder, setOpenAssignOrder] = useState(false);
const [selectedDeliveryman, setSelectedDeliveryman] = useState<any>(null);
  const [menu, setMenu] = useState<{
    id: string | null;
    x: number;
    y: number;
  }>({ id: null, x: 0, y: 0 });

  const router = useRouter();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  /* ================= MUTATIONS ================= */
  const statusMutation = useUpdateDeliverymanStatus();
  const deleteMutation = useDeleteDeliveryman();
const handleAssignOrderClick = (dm: any) => {
  setSelectedDeliveryman(dm);
  setOpenAssignOrder(true);
  setMenu({ id: null, x: 0, y: 0 });
};
  /* ================= CLOSE ON OUTSIDE CLICK ================= */
  useEffect(() => {
    const handleClick = (e: any) => {
      if (
        menuRef.current?.contains(e.target) ||
        triggerRef.current?.contains(e.target)
      ) {
        return;
      }
      setMenu({ id: null, x: 0, y: 0 });
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /* ================= STATUS TOGGLE ================= */
  const toggleStatus = async (dm: any) => {
  // AVAILABLE = active/online
  const newStatus =
    dm.status === "AVAILABLE" ? "OFFLINE" : "AVAILABLE";

  try {
    await statusMutation.mutateAsync({
      id: dm.id,
      status: newStatus,
    });

    refresh?.();
  } catch (err) {
    void err;
  }
};
  /* ================= DELETE ================= */
  const handleDelete = async (id: string) => {
    const confirm = window.confirm(
      "Are you sure you want to delete this deliveryman?"
    );
    if (!confirm) return;

    try {
      await deleteMutation.mutateAsync(id);
      refresh?.();
    } catch (err) {
      void err;
    }
  };

  /* ================= EDIT ================= */
  const handleEdit = (id: string) => {
    router.push(`/deliveryman/add?editId=${id}`);
  };

  /* ================= DROPDOWN ================= */
  const openDropdown = (e: any, id: string) => {
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();

    setMenu({
      id,
      x: rect.right - 140,
      y: rect.bottom + 8,
    });

    triggerRef.current = e.currentTarget;
  };

  if (!loading && (!data || data.length === 0)) {
    return (
      <EmptyState
        title="Looks like there are no Delivery Man yet!"
        description="You haven’t added any deliveryman yet."
      />
    );
  }

  const currentPage = Number(meta?.page) || 1;
  const limit = Number(meta?.limit) || 10;

  return (
    <>
      {/* ================= DESKTOP ================= */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-none">
              <TableHead className="w-[50px]">
                <Checkbox />
              </TableHead>
              <SortableHeader label="SL" />
              <SortableHeader label="Delivery Man" />
              <SortableHeader label="Delivery Man Info" />
              <TableHead className="text-center">
                Assign Limit
              </TableHead>
              <TableHead>Order Info</TableHead>
              <SortableHeader label="Status" />
              <TableHead className="text-center">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.map((dm, i) => (
              <TableRow key={dm.id} className="border-none h-[70px]">
                <TableCell>
                  <Checkbox />
                </TableCell>

                <TableCell>
                  {(currentPage - 1) * limit + i + 1}
                </TableCell>

                <TableCell>
                  {dm.firstName} {dm.lastName}
                </TableCell>

                <TableCell>
                  <p>{dm.phone}</p>
                  <p className="text-gray-500 text-sm">
                    {dm.email}
                  </p>
                </TableCell>

                <TableCell className="text-center">
                  Not Set
                </TableCell>

                <TableCell>
                  <p>Total Orders: {dm._count?.orders || 0}</p>
                </TableCell>

                <TableCell>
                 <Switch
  checked={dm.status === "AVAILABLE"}
  onCheckedChange={() => toggleStatus(dm)}
  disabled={statusMutation.isPending}
/>
                </TableCell>

                <TableCell>
                  <div className="flex justify-center gap-2">
                    <Eye
                      size={18}
                      className="cursor-pointer"
                      onClick={() => {
                        setSelected(dm);
                        setOpenDetails(true);
                      }}
                    />

                    <button
                      onClick={(e) => openDropdown(e, dm.id)}
                    >
                      <MoreHorizontal size={18} />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <PaginationSection
          meta={meta}
          onPageChange={onPageChange}
        />
      </div>

      {/* ================= DROPDOWN ================= */}
     {menu.id &&
  createPortal(
    <div
      ref={menuRef}
      style={{
        position: "fixed",
        top: menu.y,
        left: menu.x,
        zIndex: 99999,
      }}
      className="w-44 bg-white border border-gray-200 rounded-xl shadow-lg py-2"
    >
      <button
        onClick={() => {
          const dm = data.find((item) => item.id === menu.id);
          if (dm) handleAssignOrderClick(dm);
        }}
        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-gray-100"
      >
        <ClipboardList size={16} />
        Assign Order
      </button>

      <div className="h-px bg-gray-200 my-1" />

      <button
        onClick={() => {
          handleEdit(menu.id!);
          setMenu({ id: null, x: 0, y: 0 });
        }}
        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-gray-100"
      >
        <Pencil size={16} />
        Edit
      </button>

      <div className="h-px bg-gray-200 my-1" />

      <button
        onClick={() => {
          handleDelete(menu.id!);
          setMenu({ id: null, x: 0, y: 0 });
        }}
        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
      >
        <Trash2 size={16} />
        Delete
      </button>
    </div>,
    document.body
  )}

      {/* ================= MOBILE ================= */}
      <div className="flex flex-col gap-4 md:hidden">
        {data.map((dm) => (
          <div
            key={dm.id}
            className="bg-white p-4 rounded-lg border"
          >
            <div className="flex justify-between">
              <p>
                {dm.firstName} {dm.lastName}
              </p>
             <Switch
  checked={dm.status === "AVAILABLE"}
  onCheckedChange={() => toggleStatus(dm)}
  disabled={statusMutation.isPending}
/>
            </div>

            <p>{dm.phone}</p>
            <p>{dm.email}</p>

            <div className="flex justify-end gap-2 mt-2">
              <Eye
                size={18}
                onClick={() => {
                  setSelected(dm);
                  setOpenDetails(true);
                }}
              />
              <button
                onClick={(e) => openDropdown(e, dm.id)}
              >
                <MoreHorizontal size={18} />
              </button>
            </div>
          </div>
        ))}

        <PaginationSection
          meta={meta}
          onPageChange={onPageChange}
        />

        <DeliveryManDetails
          open={openDetails}
          onOpenChange={setOpenDetails}
          data={selected}
        />

        <AssignOrderModal
  open={openAssignOrder}
  onOpenChange={setOpenAssignOrder}
  deliveryman={selectedDeliveryman}
  onSuccess={() => {
    refresh?.();
    setOpenAssignOrder(false);
  }}
/>

      </div>
    </>
  );
};

export default DeliveryManTable;