"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Eye, MoreHorizontal } from "lucide-react";
import EmptyState from "../common/EmptyState";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import TableSkeleton from "../common/TableSkeleton";
import SortHeader from "../common/sort-header";

interface Order {
  id: string;
  orderType?: string;
  status?: string;
  totalAmount?: number;
  createdAt?: string;
  isGroupOrder?: boolean;
}
interface OrdersTableProps {
  orders: any[];
  loading: boolean;
  sortKey: any;
  sortDir: "asc" | "desc";
  onSort: (key: any) => void;
  activeTab: string; //  NEW
}

const OrdersTable = ({
  orders,
  loading,
  sortKey,
  sortDir,
  onSort,
  activeTab
}: OrdersTableProps) => {
  const router = useRouter();

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

  const getOrderRoute = (order: Order) =>
    order.isGroupOrder
      ? `/orders/group/${order.id}`
      : `/orders/details/${order.id}`;

  return (
    <div className="space-y-4">
      {/* MOBILE unchanged */}

      {/* DESKTOP */}
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
  {orders.map((order) => (
    <TableRow key={order.id} className="border-none h-[70px]">
      <TableCell>
        <Checkbox />
      </TableCell>

      {activeTab === "reservations" ? (
        <>
          <TableCell className="px-4 text-gray-500">{order.id}</TableCell>

          <TableCell className="px-4 text-gray-600">
            {order.customerName || "-"}
          </TableCell>

          <TableCell className="px-4">
            {order.guestCount}
          </TableCell>

          <TableCell className="px-4 text-gray-500">
            {order.reservationDate
              ? new Date(order.reservationDate).toLocaleString()
              : "-"}
          </TableCell>

          <TableCell className="px-4">
            <span className="text-yellow-600 font-medium">
              {order.status}
            </span>
          </TableCell>
        </>
      ) : (
        <>
          <TableCell className="px-4 text-gray-500">{order.id}</TableCell>

          <TableCell className="px-4 text-gray-500">
            {order.createdAt
              ? new Date(order.createdAt).toLocaleDateString()
              : "-"}
          </TableCell>

          <TableCell className="px-4 text-gray-600">
            {order.orderType ?? "-"}
          </TableCell>

          <TableCell className="px-4 font-medium text-green-600">
            ${order.totalAmount ?? 0}
          </TableCell>

          <TableCell className="px-4">
            <span className="text-sm font-medium text-yellow-600">
              {order.status}
            </span>
          </TableCell>
        </>
      )}

      <TableCell className="px-4">
        <div className="flex items-center justify-center gap-2 text-gray-500">
          <button className="p-2 hover:text-primary" onClick={() => router.push(getOrderRoute(order))}>
            <Eye size={18} />
          </button>

          <button className="p-2 hover:text-primary">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </TableCell>
    </TableRow>
  ))}
</TableBody>
        </Table>
      </div>
    </div>
  );
};

export default OrdersTable;