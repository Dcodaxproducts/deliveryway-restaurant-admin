import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ContainerProps = {
  children: ReactNode;
  className?: string;
};

export default function Container({ children, className }: ContainerProps) {
  return (
    <div
      className={cn(
        "mb-[22px] w-full space-y-[24px] overflow-x-hidden px-[14px] py-[20px] lg:mb-[52px] lg:p-[24px]",
        className
      )}
    >
      {children}
    </div>
  );
}
