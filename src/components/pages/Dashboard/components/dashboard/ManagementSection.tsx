import { ManagementItem } from "@/types/dashboard";
import ManagementCard from "@/components/cards/ManagementCard";
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
      variant="plain"
      padding="none"
      className={className}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {items.map((item) => (
          <ManagementCard key={item.id} data={item} />
        ))}
      </div>
    </SectionCard>
  );
};

export default ManagementSection;
