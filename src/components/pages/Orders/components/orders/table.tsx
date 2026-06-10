"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, MoreHorizontal, RefreshCw } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import TableSkeleton from "@/components/common/TableSkeleton";
import SortHeader from "@/components/common/sort-header";
import { OrderStatusUpdateDialog } from "@/components/pages/Orders/components/orders/OrderStatusUpdateDialog";
import { ORDER_STATUS_LABEL_KEYS } from "@/lib/status-labels";
import { useTranslations } from "next-intl";

export type OrdersTableRow = {
  id: string;
  orderType?: string;
  status?: string;
  totalAmount?: number;
  createdAt?: string;
  orderTime?: string;
  deliveryOtp?: string;
  isGroupOrder?: boolean;
  customerName?: string;
  guestCount?: number;
  reservationDate?: string;
};

interface OrdersTableProps {
  orders: OrdersTableRow[];
  loading: boolean;
  sortKey: keyof OrdersTableRow | null;
  sortDir: "asc" | "desc";
  onSort: (key: keyof OrdersTableRow) => void;
  activeTab: string;
}

export function OrdersTable({
  orders,
  loading,
  sortKey,
  sortDir,
  onSort,
  activeTab
}: OrdersTableProps) {
  const router = useRouter();
  const common = useTranslations("common");
  const t = useTranslations("orders");
  const [statusOrder, setStatusOrder] = useState<OrdersTableRow | null>(null);
  const getStatusLabel = (status?: string) =>
    status && ORDER_STATUS_LABEL_KEYS[status]
      ? t(ORDER_STATUS_LABEL_KEYS[status])
      : status;

  if (loading) {
    return (
      <>
        <div className="lg:hidden text-sm text-gray-400 py-10 text-center">
          {t("loading")}
        </div>

        <TableSkeleton
          headers={[t("orderId"), t("date"), t("orderType"), t("amount"), t("statusLabel")]}
          rows={6}
          showCheckbox
          showActions
        />
      </>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <EmptyState
        title={t("emptyTitle")}
        description={t("emptyDescription")}
      />
    );
  }

  const getOrderRoute = ({ id, isGroupOrder }: OrdersTableRow) =>
    isGroupOrder
      ? `/orders/group/${id}`
      : `/orders/details/${id}`;

  return (
    <div className="space-y-4">

      <div className="hidden lg:block">
        <Table>
         <TableHeader>
  <TableRow className="border-none">
    <TableHead className="w-[50px]">
      <Checkbox />
    </TableHead>

    {activeTab === "reservations" ? (
      <>
        <SortHeader label={t("reservationId")} sortKey="id" activeKey={sortKey} direction={sortDir} onSort={onSort} />
        <SortHeader label={t("customer")} sortKey="customerName" activeKey={sortKey} direction={sortDir} onSort={onSort} />
        <SortHeader label={t("guests")} sortKey="guestCount" activeKey={sortKey} direction={sortDir} onSort={onSort} />
        <SortHeader label={t("reservationDate")} sortKey="reservationDate" activeKey={sortKey} direction={sortDir} onSort={onSort} />
        <SortHeader label={t("statusLabel")} sortKey="status" activeKey={sortKey} direction={sortDir} onSort={onSort} />
      </>
    ) : (
      <>
        <SortHeader label={t("orderId")} sortKey="id" activeKey={sortKey} direction={sortDir} onSort={onSort} />
        <SortHeader label={t("date")} sortKey="createdAt" activeKey={sortKey} direction={sortDir} onSort={onSort} />
        <SortHeader label={t("orderType")} sortKey="orderType" activeKey={sortKey} direction={sortDir} onSort={onSort} />
        <SortHeader label={t("amount")} sortKey="totalAmount" activeKey={sortKey} direction={sortDir} onSort={onSort} />
        <SortHeader label={t("statusLabel")} sortKey="status" activeKey={sortKey} direction={sortDir} onSort={onSort} />
      </>
    )}

    <TableHead className="text-center">{common("actions")}</TableHead>
  </TableRow>
</TableHeader>

        <TableBody>
  {orders.map((order) => {
    const {
      id,
      customerName,
      guestCount,
      reservationDate,
      status,
      createdAt,
      orderType,
      totalAmount,
    } = order;

    return (
    <TableRow key={id} className="border-none h-[70px]">
      <TableCell>
        <Checkbox />
      </TableCell>

      {activeTab === "reservations" ? (
        <>
          <TableCell className="px-4 text-gray-500">{id}</TableCell>

          <TableCell className="px-4 text-gray-600">
            {customerName?.trim() || "-"}
          </TableCell>

          <TableCell className="px-4">
            {guestCount}
          </TableCell>

          <TableCell className="px-4 text-gray-500">
            {reservationDate
              ? new Date(reservationDate).toLocaleString()
              : "-"}
          </TableCell>

          <TableCell className="px-4">
            <span className="text-yellow-600 font-medium">
              {getStatusLabel(status)}
            </span>
          </TableCell>
        </>
      ) : (
        <>
          <TableCell className="px-4 text-gray-500">{id}</TableCell>

          <TableCell className="px-4 text-gray-500">
            {createdAt
              ? new Date(createdAt).toLocaleDateString()
              : "-"}
          </TableCell>

          <TableCell className="px-4 text-gray-600">
            {orderType ?? "-"}
          </TableCell>

          <TableCell className="px-4 font-medium text-green-600">
            ${totalAmount ?? 0}
          </TableCell>

          <TableCell className="px-4">
            <span className="text-sm font-medium text-yellow-600">
              {getStatusLabel(status)}
            </span>
          </TableCell>
        </>
      )}

      <TableCell className="px-4">
        <div className="flex items-center justify-center gap-2 text-gray-500">
          <button
            type="button"
            className="p-2 hover:text-primary"
            onClick={() => router.push(getOrderRoute(order))}
          >
            <Eye size={18} />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="p-2 hover:text-primary">
                <MoreHorizontal size={18} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => router.push(getOrderRoute(order))}>
                <Eye size={16} />
                {common("viewDetails")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusOrder(order)}>
                <RefreshCw size={16} />
                {common("updateStatus")}
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
      </div>

      <OrderStatusUpdateDialog
        open={Boolean(statusOrder)}
        order={statusOrder}
        onOpenChange={(open) => {
          if (!open) setStatusOrder(null);
        }}
      />
    </div>
  );
}
