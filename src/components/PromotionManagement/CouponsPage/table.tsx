"use client";

import { useEffect, useState } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import SortableHeader from "@/components/common/sortable-head";
import EmptyState from "@/components/common/EmptyState";
import PromotionCreateLink from "../PromotionOverview/PromotionCreateLink";
import PaginationSection from "@/components/pagination";
import { Eye, MoreHorizontal, Pencil } from "lucide-react";
import { useHttpClient } from "@/hooks/useHttpClient";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

const CouponsTable = () => {
  const { token } = useAuth();
  const { get, post } = useHttpClient(token);
  const router = useRouter();

  const [coupons, setCoupons] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [page, setPage] = useState(1);

  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
  const [openView, setOpenView] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  const getStoredAuth = () => {
    const stored = localStorage.getItem("auth");
    return stored ? JSON.parse(stored) : null;
  };

  const fetchCoupons = async (pageNumber = 1) => {
    const stored = getStoredAuth();
    const restaurantId = stored?.user?.restaurantId;

    if (!restaurantId) return;

    const res = await get(
      `/v1/coupons?restaurantId=${restaurantId}&page=${pageNumber}&limit=10`
    );

    if (!res) return;

    setCoupons(res.data || res || []);
    setMeta(res.meta || null);
  };

  useEffect(() => {
    if (!token) return;
    fetchCoupons(page);
  }, [token, page]);

  const toggleStatus = async (coupon: any) => {
    const endpoint = coupon.isActive
      ? `/v1/coupons/${coupon.code}/suspend`
      : `/v1/coupons/${coupon.code}/activate`;

    await post(endpoint, {});
    fetchCoupons(page);
  };

  const getSerial = (index: number) => {
    const currentPage = meta?.page || page || 1;
    const limit = meta?.limit || 10;
    return (currentPage - 1) * limit + index + 1;
  };

  if (!coupons.length) {
    return (
      <>
        <EmptyState
          title="Looks like there are no Coupons yet!"
          description="You haven’t added any Coupons yet. Start by creating a new"
        />
        <PromotionCreateLink
          label="Create New Coupon"
          href="/promotion-management/coupons/add"
        />
      </>
    );
  }

  return (
    <>
      {/* ================= DESKTOP (UNCHANGED) ================= */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-none">
              <TableHead className="w-[40px]"><Checkbox /></TableHead>
              <SortableHeader label="SL" />
              <SortableHeader label="Coupon Code" />
              <SortableHeader label="Coupon Info" />
              <SortableHeader label="Branch" />
              <SortableHeader label="Total Usage" />
              <SortableHeader label="Status" />
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {coupons.map((c, i) => (
              <TableRow key={c.id} className="border-none h-[72px]">

                <TableCell><Checkbox /></TableCell>

                <TableCell>{getSerial(i)}</TableCell>

                <TableCell>
                  <p className="font-medium">{c.title}</p>
                  <p className="text-gray-500 text-sm">code: {c.code}</p>
                </TableCell>

                <TableCell>
                  <div className="text-sm text-gray-600">
                    <p>Per User: {c.maxUsesPerCustomer}</p>
                    <p>Amount: {c.discountValue}</p>
                    <p>Type: {c.discountType}</p>
                  </div>
                </TableCell>

                <TableCell className="text-sm">{c.branchId}</TableCell>

                <TableCell>{c.usedCount}</TableCell>

                <TableCell>
                  <Switch
                    checked={c.isActive}
                    onCheckedChange={() => toggleStatus(c)}
                  />
                </TableCell>

                {/*  UPDATED ACTIONS */}
                <TableCell>
                  <div className="flex justify-center gap-2 relative">

                    <button
                      onClick={() => {
                        setSelectedCoupon(c);
                        setOpenView(true);
                      }}
                    >
                      <Eye size={18} />
                    </button>

                    <button
                      onClick={() =>
                        setDropdownOpen(dropdownOpen === c.id ? null : c.id)
                      }
                    >
                      <MoreHorizontal size={18} />
                    </button>

                    {dropdownOpen === c.id && (
                      <div className="absolute right-0 top-8 bg-white border rounded-md shadow-md w-32 z-50">
                        <button
                          className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 w-full"
                          onClick={() =>
                            router.push(`/promotion-management/coupons/add?coupon=${c.code}`)
                          }
                        >
                          <Pencil size={14} /> Edit
                        </button>
                      </div>
                    )}

                  </div>
                </TableCell>

              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ================= PAGINATION ================= */}
      <div className="mt-6">
        <PaginationSection meta={meta} onPageChange={setPage} />
      </div>

      {/* =================  PREMIUM MODAL ================= */}
      {openView && selectedCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">

          <div className="bg-white w-[520px] rounded-2xl shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <div>
                <h2 className="text-lg font-semibold">Coupon Details</h2>
                <p className="text-sm text-gray-500">{selectedCoupon.code}</p>
              </div>
              <button
                onClick={() => setOpenView(false)}
                className="text-gray-400 hover:text-black text-xl"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6 grid grid-cols-2 gap-5 text-sm">

              {[
                ["Title", selectedCoupon.title],
                ["Discount", selectedCoupon.discountValue],
                ["Type", selectedCoupon.discountType],
                ["Min Order", selectedCoupon.minOrderAmount || 0],
                ["Max Discount", selectedCoupon.maxDiscountAmount || 0],
                ["Usage", selectedCoupon.usedCount],
                ["Per User Limit", selectedCoupon.maxUsesPerCustomer],
                ["Status", selectedCoupon.isActive ? "Active" : "Inactive"],
              ].map(([label, value], idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-500 text-xs">{label}</p>
                  <p className="font-semibold mt-1">{value}</p>
                </div>
              ))}

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t flex justify-end">
              <button
                onClick={() => setOpenView(false)}
                className="px-5 py-2 bg-primary text-white rounded-md"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default CouponsTable;