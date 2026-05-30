import { Info } from "lucide-react";

export function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-[12px]">
      <Info size={18} className="text-gray-400" />
      <span className="text-base font-semibold text-[#646982]">
        {title}
      </span>
    </div>
  );
}
