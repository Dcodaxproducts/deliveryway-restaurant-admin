"use client";

import { useTranslations } from "next-intl";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  getCustomerDisplayEmail,
  getCustomerFullName,
  getCustomerInitials,
  hasInternalGuestEmail,
} from "@/components/pages/TableReservations/utils/table-reservations-formatters";
import type { TableReservationCustomer } from "@/types/table-reservations";

type TableReservationCustomerCellProps = {
  customer: TableReservationCustomer | null;
  /** From the reservation's persisted `isWalkIn` flag. */
  isWalkIn?: boolean;
};

export default function TableReservationCustomerCell({
  customer,
  isWalkIn = false,
}: TableReservationCustomerCellProps) {
  const t = useTranslations("tableReservations");
  const fullName = getCustomerFullName(customer);
  const email = getCustomerDisplayEmail(customer);
  const walkIn = isWalkIn || hasInternalGuestEmail(customer);

  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className="size-9">
        {customer?.avatarUrl ? (
          <AvatarImage src={customer.avatarUrl} alt={fullName} />
        ) : null}
        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
          {getCustomerInitials(customer)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-gray-900">{fullName}</p>
        <p className="truncate text-xs text-gray-500">
          {email || (walkIn ? t("walkInGuest") : t("noEmail"))}
        </p>
        <p className="truncate text-xs text-gray-400">
          {customer?.phone || t("noPhone")}
        </p>
      </div>
    </div>
  );
}
