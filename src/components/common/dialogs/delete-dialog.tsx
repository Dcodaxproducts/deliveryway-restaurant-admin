"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LoaderCircle, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

export type ConfirmDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    isLoading?: boolean;
    title?: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    busyLabel?: string;
    error?: ReactNode;
    tone?: "danger" | "default";
};

export function ConfirmDialog({
    open,
    onOpenChange,
    onConfirm,
    isLoading,
    title,
    description,
    confirmLabel,
    cancelLabel,
    busyLabel,
    error,
    tone = "danger",
}: ConfirmDialogProps) {
    const t = useTranslations("common");
    const dialogTitle = title ?? t("confirmDeletion");
    const dialogDescription = description ?? t("deleteConfirmation");

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (!nextOpen && isLoading) return;
                onOpenChange(nextOpen);
            }}
        >
            <DialogContent
                showCloseButton={!isLoading}
                onEscapeKeyDown={(event) => isLoading && event.preventDefault()}
                onPointerDownOutside={(event) => isLoading && event.preventDefault()}
                className="max-w-[380px] rounded-[var(--ui-radius-panel)] p-5 sm:p-6"
            >
                <DialogHeader className="flex flex-col items-center text-center gap-[12px]">
                    <div className="flex size-12 items-center justify-center rounded-[var(--ui-radius-card)] bg-[var(--ui-danger-soft)]">
                        <Trash2 size={24} className="text-[var(--ui-danger)]" />
                    </div>
                    <DialogTitle className="text-[18px] font-semibold text-[var(--ui-text)]">
                        {dialogTitle}
                    </DialogTitle>
                    <DialogDescription className="text-center text-sm text-[var(--ui-text-muted)]">
                        {dialogDescription}
                    </DialogDescription>
                </DialogHeader>

                {error ? (
                    <div
                        role="alert"
                        className="rounded-[var(--ui-radius-control)] bg-[var(--ui-danger-soft)] px-3 py-2 text-sm text-[var(--ui-danger)]"
                    >
                        {error}
                    </div>
                ) : null}

                <DialogFooter className="flex gap-[12px] mt-[24px] sm:flex-row">
                    <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        {cancelLabel ?? t("cancel")}
                    </Button>
                    <Button
                        type="button"
                        variant={tone === "danger" ? "destructive" : "default"}
                        className="flex-1"
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <LoaderCircle aria-hidden="true" className="animate-spin" />
                                {busyLabel ?? t("deleting")}
                            </>
                        ) : (confirmLabel ?? t("delete"))}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default ConfirmDialog;
