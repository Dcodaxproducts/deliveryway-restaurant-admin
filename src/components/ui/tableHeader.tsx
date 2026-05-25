import { RxTriangleDown, RxTriangleUp } from "react-icons/rx";
import { TableHead } from "./table";

const Header = ({ label, className }: { label: string; className?: string }) => (
    <TableHead className={className}>
        <div className="flex items-center gap-[2px]">
            <span className="text-sm font-medium">{label}</span>
            <div className="flex flex-col text-[#D3D6E4] ml-[2px]">
                <RxTriangleUp size={20} className="-mb-[13px]" />
                <RxTriangleDown size={20} />
            </div>
        </div>
    </TableHead>
);

export default Header;