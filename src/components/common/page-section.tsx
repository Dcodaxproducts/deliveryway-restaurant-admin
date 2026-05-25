import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

export const pageSectionVariants = cva("rounded-[20px] bg-white shadow-sm", {
  variants: {
    padding: {
      none: "p-0",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    },
  },
  defaultVariants: {
    padding: "md",
  },
});

type PageSectionProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof pageSectionVariants>;

export function PageSection({ className, padding, ...props }: PageSectionProps) {
  return <div className={cn(pageSectionVariants({ padding }), className)} {...props} />;
}
