"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ClickTooltipProps = {
  children: ReactNode;
  content: ReactNode;
  contentClassName?: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
};

export function ClickTooltip({
  children,
  content,
  contentClassName,
  side = "top",
  align = "start",
}: ClickTooltipProps) {
  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>{children}</PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          side={side}
          align={align}
          sideOffset={10}
          collisionPadding={16}
          className={cn(
            "z-50 max-w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700 shadow-xl outline-none",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
            contentClassName
          )}
        >
          {content}
          <PopoverPrimitive.Arrow className="h-3 w-3 fill-white stroke-gray-200" />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
