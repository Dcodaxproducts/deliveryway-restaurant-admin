import type {
  TableReservation,
  TableReservationCustomer,
  TableReservationStatus,
} from "@/types/table-reservations";

const dateTimeFormatter = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export const EMPTY_TEXT = "—";

export function formatDateTime(value?: string | null) {
  if (!value) return EMPTY_TEXT;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return EMPTY_TEXT;

  return dateTimeFormatter.format(date);
}

export function formatReservationDate(value?: string | null) {
  return formatDateTime(value);
}

export function formatShortId(id?: string | null) {
  if (!id) return EMPTY_TEXT;
  if (id.length <= 10) return id;
  return `${id.slice(0, 6)}...${id.slice(-4)}`;
}

export function getCustomerFullName(customer?: TableReservationCustomer | null) {
  const fullName = `${customer?.firstName ?? ""} ${customer?.lastName ?? ""}`.trim();
  return fullName || "Unknown customer";
}

export function getCustomerInitials(customer?: TableReservationCustomer | null) {
  const fullName = getCustomerFullName(customer);
  if (fullName === "Unknown customer") return "UC";

  const parts = fullName.split(/\s+/).filter(Boolean);
  const initials = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : fullName.slice(0, 2);

  return initials.toUpperCase();
}

export function formatStatusLabel(status?: TableReservationStatus | null) {
  if (!status) return EMPTY_TEXT;

  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function getBranchName(reservation: TableReservation) {
  return reservation.branch?.name || "No branch";
}

