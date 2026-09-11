import Link from "next/link";
import { ManagementItem } from "@/types/dashboard";

interface ManagementCardProps {
  data: ManagementItem;
}

const ManagementCard = ({ data }: ManagementCardProps) => {
  return (
    <article className="group flex min-h-44 flex-col justify-between rounded-[var(--ui-radius-card)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-4 shadow-[var(--ui-shadow-xs)] transition duration-[var(--ui-motion-normal)] hover:-translate-y-0.5 hover:border-[var(--ui-border-strong)] hover:shadow-[var(--ui-shadow-sm)] sm:p-5">
      <div>
        <h3 className="text-base font-semibold leading-5 tracking-[-0.01em] text-[var(--ui-text)]">
          {data.title}
        </h3>

        <p className="mt-1.5 max-w-[42ch] text-sm leading-5 text-[var(--ui-text-muted)]">
          {data.description}
        </p>
      </div>

      <Link
        href={data.actionHref}
        className="mt-4 inline-flex min-h-10 w-fit items-center justify-center rounded-[var(--ui-radius-control)] bg-[var(--ui-brand-soft)] px-3.5 text-xs font-semibold text-primary transition duration-[var(--ui-motion-fast)] hover:bg-primary hover:text-white active:translate-y-px"
      >
        {data.actionLabel}
      </Link>
    </article>
  );
};

export default ManagementCard;
