import Link from "next/link";
import { ManagementItem } from "@/types/dashboard";

interface ManagementCardProps {
  data: ManagementItem;
}

const ManagementCard = ({ data }: ManagementCardProps) => {
  return (
    <div className="flex flex-col items-center justify-between rounded-[16px] bg-white px-6 py-8 text-center">
      
      <div>
        <h3 className="text-base font-semibold text-dark">
          {data.title}
        </h3>

        <p className="mt-2 text-sm text-gray-400 leading-relaxed">
          {data.description}
        </p>
      </div>

      <Link
        href={data.actionHref}
        className="mt-6 inline-flex items-center justify-center rounded-[10px] bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-red-600 transition w-[195px]"
      >
        {data.actionLabel}
      </Link>
    </div>
  );
};

export default ManagementCard;
