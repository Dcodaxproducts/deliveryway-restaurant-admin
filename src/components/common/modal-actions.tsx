import { cn } from "@/lib/utils";

export function ModalActions({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center justify-end gap-3 pt-4", className)} {...props} />;
}
