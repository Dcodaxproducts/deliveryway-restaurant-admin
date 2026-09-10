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
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

export type ConfirmDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    isLoading?: boolean;
    title?: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
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
    tone = "danger",
}: ConfirmDialogProps) {
    const t = useTranslations("common");
    const dialogTitle = title ?? t("confirmDeletion");
    const dialogDescription = description ?? t("deleteConfirmation");

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[400px] rounded-[var(--ui-radius-panel)] p-6 sm:p-[30px]">
                <DialogHeader className="flex flex-col items-center text-center gap-[12px]">
                    <div className="flex size-14 items-center justify-center rounded-[var(--ui-radius-card)] bg-[var(--ui-danger-soft)]">
                        <Trash2 size={24} className="text-[var(--ui-danger)]" />
                    </div>
                    <DialogTitle className="text-[18px] font-semibold text-gray-800">
                        {dialogTitle}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-gray-500 text-center">
                        {dialogDescription}
                    </DialogDescription>
                </DialogHeader>

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
                        {isLoading ? t("deleting") : (confirmLabel ?? t("delete"))}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default ConfirmDialog;
