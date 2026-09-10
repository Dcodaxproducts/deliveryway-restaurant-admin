import { ManagementItem } from "@/types/dashboard";
import ManagementCard from "@/components/cards/ManagementCard";
import { cn } from "@/lib/utils";
import { SectionCard } from "@/components/common/SectionCard";

interface ManagementSectionProps {
  items: ManagementItem[];
  className?: string;
}

const ManagementSection = ({ items, className }: ManagementSectionProps) => {
  return (
    <SectionCard
      title="Manage your restaurant"
      description="Jump into the areas you use most often."
      padding="none"
      className={cn("bg-transparent shadow-none", className)}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <ManagementCard key={item.id} data={item} />
        ))}
      </div>
    </SectionCard>
  );
};

export default ManagementSection;
