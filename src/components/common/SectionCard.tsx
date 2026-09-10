import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

export const sectionCardVariants = cva("overflow-hidden text-[var(--ui-text)]", {
  variants: {
    variant: {
      plain: "bg-transparent",
      outlined:
        "rounded-[var(--ui-radius-card)] border border-[var(--ui-border)] bg-[var(--ui-surface)]",
      raised:
        "rounded-[var(--ui-radius-panel)] bg-[var(--ui-surface-raised)] shadow-[var(--ui-shadow-sm)]",
    },
    padding: {
      none: "p-0",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    },
  },
  defaultVariants: {
    variant: "raised",
    padding: "md",
  },
});

export type SectionCardProps = Omit<React.HTMLAttributes<HTMLElement>, "title"> &
  VariantProps<typeof sectionCardVariants> & {
    title?: React.ReactNode;
    description?: React.ReactNode;
    action?: React.ReactNode;
    footer?: React.ReactNode;
  };

export function SectionCard({
  className,
  variant,
  padding,
  title,
  description,
  action,
  footer,
  children,
  ...props
}: SectionCardProps) {
  return (
    <section
      data-slot="section-card"
      className={cn(sectionCardVariants({ variant, padding }), className)}
      {...props}
    >
      {title || description || action ? (
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            {title ? <h2 className="text-lg font-semibold leading-6">{title}</h2> : null}
            {description ? (
              <div className="mt-1 text-sm leading-5 text-[var(--ui-text-muted)]">
                {description}
              </div>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      {children}
      {footer ? (
        <div className="mt-5 border-t border-[var(--ui-border)] pt-4">{footer}</div>
      ) : null}
    </section>
  );
}
