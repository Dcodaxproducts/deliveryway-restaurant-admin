"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { SectionCard, type SectionCardProps } from "@/components/common/SectionCard";
import { cn } from "@/lib/utils";

export type FormLayoutProps = HTMLAttributes<HTMLDivElement> & {
  aside?: ReactNode;
  actions?: ReactNode;
  actionsClassName?: string;
};

export function FormLayout({
  aside,
  actions,
  actionsClassName,
  children,
  className,
  ...props
}: FormLayoutProps) {
  return (
    <div data-slot="form-layout" className={cn("min-w-0 space-y-5", className)} {...props}>
      <div
        data-slot="form-layout-body"
        className={cn(
          "grid min-w-0 gap-5",
          aside && "xl:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] xl:items-start",
        )}
      >
        <div data-slot="form-layout-main" className="min-w-0 space-y-5">
          {children}
        </div>
        {aside ? (
          <aside data-slot="form-layout-aside" className="min-w-0 space-y-5 xl:sticky xl:top-24">
            {aside}
          </aside>
        ) : null}
      </div>
      {actions ? (
        <div data-slot="form-layout-actions" className={actionsClassName}>
          {actions}
        </div>
      ) : null}
    </div>
  );
}

type FormSectionColumns = 1 | 2 | 3;

export type FormSectionProps = Omit<SectionCardProps, "children" | "action"> & {
  children: ReactNode;
  action?: ReactNode;
  columns?: FormSectionColumns;
  collapsible?: boolean;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  toggleLabel?: string;
  fieldsClassName?: string;
};

const columnsClass: Record<FormSectionColumns, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
};

export function FormSection({
  children,
  action,
  columns = 1,
  collapsible = false,
  defaultOpen = true,
  open,
  onOpenChange,
  toggleLabel = "Toggle section",
  fieldsClassName,
  ...cardProps
}: FormSectionProps) {
  const fields = (
    <div
      data-slot="form-section-fields"
      className={cn("grid min-w-0 gap-4", columnsClass[columns], fieldsClassName)}
    >
      {children}
    </div>
  );

  if (!collapsible) {
    return (
      <SectionCard data-slot="form-section" action={action} {...cardProps}>
        {fields}
      </SectionCard>
    );
  }

  return (
    <Collapsible
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={onOpenChange}
      className="group/form-section"
    >
      <SectionCard
        data-slot="form-section"
        action={
          <div className="flex items-center gap-2">
            {action}
            <CollapsibleTrigger asChild>
              <Button type="button" variant="ghost" size="icon-sm" aria-label={toggleLabel}>
                <ChevronDown
                  aria-hidden="true"
                  className="transition-transform duration-[var(--ui-motion-fast)] group-data-[state=open]/form-section:rotate-180"
                />
              </Button>
            </CollapsibleTrigger>
          </div>
        }
        {...cardProps}
      >
        <CollapsibleContent>{fields}</CollapsibleContent>
      </SectionCard>
    </Collapsible>
  );
}

export type FormActionsProps = HTMLAttributes<HTMLDivElement> & {
  primary?: ReactNode;
  secondary?: ReactNode;
  destructive?: ReactNode;
  sticky?: boolean;
};

export function FormActions({
  primary,
  secondary,
  destructive,
  sticky = false,
  children,
  className,
  ...props
}: FormActionsProps) {
  return (
    <div
      data-slot="form-actions"
      data-sticky={sticky || undefined}
      className={cn(
        "flex min-w-0 flex-col-reverse gap-2 border-t border-[var(--ui-border)] pt-4 sm:flex-row sm:items-center sm:justify-between",
        sticky &&
          "sticky bottom-0 z-[var(--ui-layer-sticky)] -mx-4 bg-[var(--ui-surface)]/95 px-4 pb-4 backdrop-blur sm:-mx-5 sm:px-5",
        className,
      )}
      {...props}
    >
      {children ?? (
        <>
          <div className="flex min-w-0 flex-col-reverse gap-2 sm:flex-row sm:items-center">
            {destructive}
          </div>
          <div className="flex min-w-0 flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
            {secondary}
            {primary}
          </div>
        </>
      )}
    </div>
  );
}

