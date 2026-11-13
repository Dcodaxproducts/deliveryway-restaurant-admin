import { Mail, Phone, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  const t = useTranslations("tableReservations");
  const fullName = getCustomerFullName(customer, t("unknownCustomer"));
  const email = customer?.email?.trim();
  const phone = customer?.phone?.trim();

  return (
    <div className="flex min-w-0 items-start gap-3">
      <Avatar className="mt-0.5 size-9 shrink-0">
        {customer?.avatarUrl ? (
          <AvatarImage src={customer.avatarUrl} alt={fullName} />
        ) : null}
        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
          {getCustomerInitials(customer)}
        </AvatarFallback>
      </Avatar>

      <dl className="min-w-0 space-y-1.5 text-xs">
        <div className="flex min-w-0 items-start gap-1.5">
          <UserRound
            aria-hidden="true"
            className="mt-0.5 size-3.5 shrink-0 text-gray-400"
          />
          <div className="min-w-0">
            <dt className="text-[11px] font-medium text-gray-400">
              {t("customerName")}
            </dt>
            <dd
              className="truncate text-sm font-semibold text-gray-900"
              title={fullName}
            >
              {fullName}
            </dd>
          </div>
        </div>

        <div className="flex min-w-0 items-start gap-1.5">
          <Mail
            aria-hidden="true"
            className="mt-0.5 size-3.5 shrink-0 text-gray-400"
          />
          <div className="min-w-0">
            <dt className="text-[11px] font-medium text-gray-400">
              {t("customerEmail")}
            </dt>
            <dd
              className="truncate text-gray-600"
              title={email || t("noEmail")}
            >
              {email ? (
                <a
                  className="hover:text-primary hover:underline"
                  href={`mailto:${email}`}
                >
                  {email}
                </a>
              ) : (
                t("noEmail")
              )}
            </dd>
          </div>
        </div>

        <div className="flex min-w-0 items-start gap-1.5">
          <Phone
            aria-hidden="true"
            className="mt-0.5 size-3.5 shrink-0 text-gray-400"
          />
          <div className="min-w-0">
            <dt className="text-[11px] font-medium text-gray-400">
              {t("customerPhone")}
            </dt>
            <dd
              className="truncate text-gray-600"
              title={phone || t("noPhone")}
            >
              {phone ? (
                <a
                  className="hover:text-primary hover:underline"
                  href={`tel:${phone}`}
                >
                  {phone}
                </a>
              ) : (
                t("noPhone")
              )}
            </dd>
          </div>
        </div>
      </dl>
    </div>
  );
}
