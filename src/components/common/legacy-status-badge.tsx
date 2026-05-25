import { cn } from "@/lib/utils";

type LegacyStatusBadgeProps = {
  status: string;
};

export default function LegacyStatusBadge({ status }: LegacyStatusBadgeProps) {
  const isActive = status === "Active";

  return <span className={cn("text-sm", isActive ? "text-green" : "text-primary")}>{status}</span>;
}
