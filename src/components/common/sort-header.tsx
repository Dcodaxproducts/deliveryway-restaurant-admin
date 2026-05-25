"use client";

import { TableHead } from "@/components/ui/table";
import { RxTriangleDown, RxTriangleUp } from "react-icons/rx";

type SortDir = "asc" | "desc";

const SortHeader = ({
    label,
    sortKey,
    activeKey,
    direction,
    onSort,
    className,
}: {
    label: string;
    sortKey: any;
    activeKey: any | null;
    direction: SortDir;
    onSort: (key: any) => void;
    className?: string;
}) => {
    const isActive = activeKey === sortKey;
    return (
        <TableHead className={className}>
            <div
                className="flex items-center gap-[2px] cursor-pointer select-none w-fit"
                onClick={() => onSort(sortKey)}
            >
                <span className="text-sm font-medium">{label}</span>
                <div className="flex flex-col text-[#D3D6E4] ml-[2px]">
                    <RxTriangleUp
                        size={20}
                        className={`-mb-[13px] ${isActive && direction === "asc" ? "text-primary" : ""}`}
                    />
                    <RxTriangleDown
                        size={20}
                        className={isActive && direction === "desc" ? "text-primary" : ""}
                    />
                </div>
            </div>
        </TableHead>
    );
};

export default SortHeader;