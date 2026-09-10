"use client";

import type { ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type RowAction = {
  id: string;
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  hidden?: boolean;
  disabled?: boolean;
  destructive?: boolean;
};

export type RowActionsProps = {
  actions: readonly RowAction[];
  label?: string;
  className?: string;
};

export function RowActions({ actions, label = "Open actions", className }: RowActionsProps) {
  const visibleActions = actions.filter((action) => !action.hidden);

  if (visibleActions.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={label}
          className={cn("size-10 rounded-[var(--ui-radius-control)]", className)}
        >
          <MoreHorizontal aria-hidden="true" className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        {visibleActions.map((action) => (
          <DropdownMenuItem
            key={action.id}
            disabled={action.disabled}
            onSelect={action.onSelect}
            className={cn(
              "min-h-10 gap-2",
              action.destructive && "text-[var(--ui-danger)] focus:text-[var(--ui-danger)]",
            )}
          >
            {action.icon}
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
