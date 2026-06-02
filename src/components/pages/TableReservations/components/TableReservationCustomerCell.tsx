import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  getCustomerFullName,
  getCustomerInitials,
} from "@/components/pages/TableReservations/utils/table-reservations-formatters";
import type { TableReservationCustomer } from "@/types/table-reservations";

type TableReservationCustomerCellProps = {
  customer: TableReservationCustomer | null;
};

export default function TableReservationCustomerCell({
  customer,
}: TableReservationCustomerCellProps) {
  const fullName = getCustomerFullName(customer);

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
          {customer?.email || "No email"}
        </p>
        <p className="truncate text-xs text-gray-400">
          {customer?.phone || "No phone"}
        </p>
      </div>
    </div>
  );
}
