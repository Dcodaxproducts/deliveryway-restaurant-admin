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

export type OrdersTableRow = {
  id: string;
  orderType?: string;
  status?: string;
  totalAmount?: number;
  createdAt?: string;
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
  const [statusOrder, setStatusOrder] = useState<OrdersTableRow | null>(null);

  if (loading) {
    return (
      <>
        <div className="lg:hidden text-sm text-gray-400 py-10 text-center">
          Loading orders...
        </div>

        <TableSkeleton
          headers={["Order ID", "Date", "Order Type", "Amount", "Status"]}
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
        title="Looks like there are no orders yet!"
        description="You haven’t received any orders yet."
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
        <SortHeader label="Reservation ID" sortKey="id" activeKey={sortKey} direction={sortDir} onSort={onSort} />
        <SortHeader label="Customer" sortKey="customerName" activeKey={sortKey} direction={sortDir} onSort={onSort} />
        <SortHeader label="Guests" sortKey="guestCount" activeKey={sortKey} direction={sortDir} onSort={onSort} />
        <SortHeader label="Reservation Date" sortKey="reservationDate" activeKey={sortKey} direction={sortDir} onSort={onSort} />
        <SortHeader label="Status" sortKey="status" activeKey={sortKey} direction={sortDir} onSort={onSort} />
      </>
    ) : (
      <>
        <SortHeader label="Order ID" sortKey="id" activeKey={sortKey} direction={sortDir} onSort={onSort} />
        <SortHeader label="Date" sortKey="createdAt" activeKey={sortKey} direction={sortDir} onSort={onSort} />
        <SortHeader label="Order Type" sortKey="orderType" activeKey={sortKey} direction={sortDir} onSort={onSort} />
        <SortHeader label="Amount" sortKey="totalAmount" activeKey={sortKey} direction={sortDir} onSort={onSort} />
        <SortHeader label="Status" sortKey="status" activeKey={sortKey} direction={sortDir} onSort={onSort} />
      </>
    )}

    <TableHead className="text-center">Actions</TableHead>
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
              {status}
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
              {status}
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
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusOrder(order)}>
                <RefreshCw size={16} />
                Update Status
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
