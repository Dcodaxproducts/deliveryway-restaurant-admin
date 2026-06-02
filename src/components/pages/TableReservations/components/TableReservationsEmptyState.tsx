import EmptyState from "@/components/common/EmptyState";

export default function TableReservationsEmptyState() {
  return (
    <EmptyState
      title="No table reservations found."
      description="Customer table reservation requests will appear here."
    />
  );
}

