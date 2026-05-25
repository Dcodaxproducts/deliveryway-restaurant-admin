import { TableHead } from "@/components/ui/table";
import { RxTriangleDown, RxTriangleUp } from "react-icons/rx";

export default function SortableHeader({
  label,
  className = "",
}: {
  label: string;
  className?: string;
}) {
  return (
    <TableHead className="text-left px-4">
      <div
        className={`flex items-center justify-start gap-2 cursor-pointer ${className}`}
      >
        <span className="font-semibold text-sm text-dark">
          {label}
        </span>

        <div className="flex flex-col -space-y-1 text-[#D3D6E4]">
          <RxTriangleUp size={12} />
          <RxTriangleDown size={12} />
        </div>
      </div>
    </TableHead>
  );
}
