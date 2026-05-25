import { ManagementItem } from "@/types/dashboard";
import ManagementCard from "../cards/ManagementCard";
import { cn } from "@/lib/utils";

interface ManagementSectionProps {
  items: ManagementItem[];
  className?: string;
}

const ManagementSection = ({ items, className }: ManagementSectionProps) => {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6",
        className
      )}
    >
      {items.map((item) => (
        <ManagementCard key={item.id} data={item} />
      ))}
    </div>
  );
};

export default ManagementSection;
