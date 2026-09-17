"use client";

import * as React from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, type DayPickerProps } from "react-day-picker";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: DayPickerProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("relative p-3", className)}
      classNames={{
        months: "flex flex-col gap-4 sm:flex-row",
        month: "space-y-4",
        month_caption: "relative flex h-9 items-center justify-center",
        caption_label: "text-sm font-semibold",
        nav: "pointer-events-none absolute inset-x-3 top-3 z-10 flex items-center justify-between",
        button_previous: cn(
          buttonVariants({ variant: "outline", size: "icon-sm" }),
          "pointer-events-auto size-8 bg-transparent p-0 opacity-70 hover:opacity-100",
        ),
        button_next: cn(
          buttonVariants({ variant: "outline", size: "icon-sm" }),
          "pointer-events-auto size-8 bg-transparent p-0 opacity-70 hover:opacity-100",
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "w-9 text-center text-xs font-medium text-muted-foreground",
        week: "mt-2 flex w-full",
        day: "relative h-9 w-9 p-0 text-center text-sm",
        day_button: cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "size-9 rounded-[var(--ui-radius-control)] p-0 font-normal aria-selected:opacity-100",
        ),
        selected:
          "rounded-[var(--ui-radius-control)] bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        today: "rounded-[var(--ui-radius-control)] bg-accent text-accent-foreground",
        outside: "text-muted-foreground opacity-45 aria-selected:opacity-30",
        disabled: "text-muted-foreground opacity-40",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClassName }) => {
          const Icon =
            orientation === "left"
              ? ChevronLeft
              : orientation === "right"
                ? ChevronRight
                : ChevronDown;

          return <Icon className={cn("size-4", chevronClassName)} />;
        },
      }}
      {...props}
    />
  );
}

export { Calendar };
