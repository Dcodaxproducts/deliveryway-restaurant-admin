import Link from "next/link";
import { ManagementItem } from "@/types/dashboard";

interface ManagementCardProps {
  data: ManagementItem;
}

const ManagementCard = ({ data }: ManagementCardProps) => {
  return (
    <article className="group flex min-h-52 flex-col justify-between rounded-[var(--ui-radius-card)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-5 shadow-[var(--ui-shadow-xs)] transition duration-[var(--ui-motion-normal)] hover:-translate-y-0.5 hover:border-[var(--ui-border-strong)] hover:shadow-[var(--ui-shadow-sm)] sm:p-6">
      <div>
        <h3 className="text-lg font-semibold tracking-[-0.01em] text-[var(--ui-text)]">
          {data.title}
        </h3>

        <p className="mt-2 max-w-[34ch] text-sm leading-6 text-[var(--ui-text-muted)]">
          {data.description}
        </p>
      </div>

      <Link
        href={data.actionHref}
        className="mt-6 inline-flex min-h-11 w-fit items-center justify-center rounded-[var(--ui-radius-control)] bg-[var(--ui-brand-soft)] px-4 text-sm font-semibold text-primary transition duration-[var(--ui-motion-fast)] hover:bg-primary hover:text-white active:translate-y-px"
      >
        {data.actionLabel}
      </Link>
    </article>
  );
};

export default ManagementCard;
