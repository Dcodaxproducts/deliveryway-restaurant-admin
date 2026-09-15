"use client";

import type { ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export type ResponsiveDialogPresentation = "auto" | "dialog" | "sheet";
export type ResponsiveDialogSize = "sm" | "md" | "lg" | "xl";

const sizeClasses: Record<ResponsiveDialogSize, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-lg",
  lg: "sm:max-w-3xl",
  xl: "sm:max-w-5xl",
};

export function getResponsiveDialogPresentation(
  presentation: ResponsiveDialogPresentation,
  isMobile: boolean,
): Exclude<ResponsiveDialogPresentation, "auto"> {
  if (presentation !== "auto") return presentation;
  return isMobile ? "sheet" : "dialog";
}

export type ResponsiveDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  presentation?: ResponsiveDialogPresentation;
  size?: ResponsiveDialogSize;
  mobileSide?: "bottom" | "right";
  busy?: boolean;
  preventCloseWhileBusy?: boolean;
  contentClassName?: string;
  bodyClassName?: string;
  actionsClassName?: string;
};

export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  actions,
  presentation = "auto",
  size = "md",
  mobileSide = "bottom",
  busy = false,
  preventCloseWhileBusy = true,
  contentClassName,
  bodyClassName,
  actionsClassName,
}: ResponsiveDialogProps) {
  const isMobile = useIsMobile();
  const resolvedPresentation = getResponsiveDialogPresentation(presentation, isMobile);
  const closeDisabled = busy && preventCloseWhileBusy;
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && closeDisabled) return;
    onOpenChange(nextOpen);
  };

  if (resolvedPresentation === "sheet") {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          side={mobileSide}
          showCloseButton={!closeDisabled}
          data-slot="responsive-dialog"
          aria-busy={busy || undefined}
          onEscapeKeyDown={(event) => closeDisabled && event.preventDefault()}
          onPointerDownOutside={(event) => closeDisabled && event.preventDefault()}
          className={cn(
            "max-h-[92dvh] overflow-hidden bg-[var(--ui-surface)]",
            mobileSide === "bottom" &&
              "inset-x-0 bottom-0 w-full rounded-t-[var(--ui-radius-panel)] border-t",
            mobileSide === "right" && "w-[min(92vw,420px)] sm:max-w-[420px]",
            contentClassName,
          )}
        >
          <SheetHeader className="border-b border-[var(--ui-border)] px-5 py-5 pr-12 text-left">
            <SheetTitle className="text-xl text-[var(--ui-text)]">{title}</SheetTitle>
            {description ? <SheetDescription>{description}</SheetDescription> : null}
          </SheetHeader>
          <div
            data-slot="responsive-dialog-body"
            className={cn("min-h-0 flex-1 overflow-y-auto px-5 py-5", bodyClassName)}
          >
            {children}
          </div>
          {actions ? (
            <SheetFooter
              data-slot="responsive-dialog-actions"
              className={cn(
                "border-t border-[var(--ui-border)] px-5 py-4 sm:flex-row sm:justify-end",
                actionsClassName,
              )}
            >
              {actions}
            </SheetFooter>
          ) : null}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        data-slot="responsive-dialog"
        aria-busy={busy || undefined}
        onEscapeKeyDown={(event) => closeDisabled && event.preventDefault()}
        onPointerDownOutside={(event) => closeDisabled && event.preventDefault()}
        className={cn(
          "max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0",
          sizeClasses[size],
          contentClassName,
        )}
      >
        <DialogHeader className="border-b border-[var(--ui-border)] px-5 py-5 pr-12 sm:px-6">
          <DialogTitle className="text-[var(--ui-text)]">{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <div
          data-slot="responsive-dialog-body"
          className={cn("min-h-0 overflow-y-auto px-5 py-5 sm:px-6", bodyClassName)}
        >
          {children}
        </div>
        {actions ? (
          <DialogFooter
            data-slot="responsive-dialog-actions"
            className={cn(
              "border-t border-[var(--ui-border)] px-5 py-4 sm:px-6",
              actionsClassName,
            )}
          >
            {actions}
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
