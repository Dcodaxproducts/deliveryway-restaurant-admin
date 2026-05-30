import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
};

export default function PageHeader({
  title,
  description,
  className,
  titleClassName,
  descriptionClassName,
}: PageHeaderProps) {
  return (
    <div className={cn("lg:space-y-[6px]", className)}>
      <h1
        className={cn(
          "text-xl font-semibold text-foreground lg:text-[32px] lg:leading-[42px]",
          titleClassName
        )}
      >
        {title}
      </h1>

      {description ? (
        <p className={cn("text-sm text-gray lg:text-base", descriptionClassName)}>
          {description}
        </p>
      ) : null}
    </div>
  );
}
