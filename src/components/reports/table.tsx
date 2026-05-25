import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ordersReport } from "@/config/analytics";
import SortableHeader from "@/components/common/sortable-head";
import { Eye, MoreHorizontal } from "lucide-react";
import Pagination from "@/components/pagination";
import EmptyState from "../common/EmptyState";

const OrdersTable = () => {
  if (!ordersReport || ordersReport.length === 0) {
    return (
      <EmptyState
        title="Looks like there are no orders yet!"
        description="You haven’t received any orders yet."
      />
    );
  }

  return (
    <>
      {/* ================= MOBILE CARDS ================= */}
      <div className="space-y-4 md:hidden">
        {ordersReport.map((order, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border p-4 space-y-3 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox checked />
                <span className="text-sm text-gray-500">#{i + 1}</span>
              </div>

              <div className="flex gap-1">
                <button className="p-2 hover:text-primary">
                  <Eye size={18} />
                </button>
                <button className="p-2 hover:text-primary">
                  <MoreHorizontal size={18} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <div className="text-gray-500">Order ID</div>
              <div className="text-right font-medium">{order.id}</div>

              <div className="text-gray-500">Order Amount</div>
              <div className="text-right font-semibold text-green-600">
                {order.orderAmount}
              </div>

              <div className="text-gray-500">Discount</div>
              <div className="text-right">{order.discountAmount}</div>

              <div className="text-gray-500">Tax</div>
              <div className="text-right">{order.taxAmount}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ================= DESKTOP TABLE ================= */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-none">
              <TableHead className="w-[50px]">
                <Checkbox />
              </TableHead>
              <TableHead className="w-[50px] font-semibold">SL</TableHead>
              <SortableHeader label="Order ID" />
              <SortableHeader label="Total Order Amount" />
              <SortableHeader label="Total Discount Amount" />
              <SortableHeader label="Total Tax Amount" />
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {ordersReport.map((order, i) => (
              <TableRow key={i} className="border-none h-[70px]">
                <TableCell>
                  <Checkbox checked />
                </TableCell>

                <TableCell className="px-4 text-gray-500">
                  {i + 1}
                </TableCell>

                <TableCell className="px-4 text-gray-500">
                  {order.id}
                </TableCell>

                <TableCell className="px-4 font-medium text-green-600">
                  {order.orderAmount}
                </TableCell>

                <TableCell className="px-4 text-gray-500">
                  {order.discountAmount}
                </TableCell>

                <TableCell className="px-4 text-gray-500">
                  {order.taxAmount}
                </TableCell>

                <TableCell className="px-4">
                  <div className="flex items-center justify-center gap-2 text-gray-500">
                    <button className="p-2 hover:text-primary">
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

      <Pagination />
    </>
  );
};

export default OrdersTable;
