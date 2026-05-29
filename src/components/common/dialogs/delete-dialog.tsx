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

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    isLoading?: boolean;
    title?: string;
    description?: string;
};

export default function DeleteDialog({
    open,
    onOpenChange,
    onConfirm,
    isLoading,
    title = "Confirm Deletion",
    description = "Are you sure you want to delete this item? This action cannot be undone."
}: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[400px] p-[30px]">
                <DialogHeader className="flex flex-col items-center text-center gap-[12px]">
                    <div className="w-[56px] h-[56px] rounded-full bg-red-50 flex items-center justify-center">
                        <Trash2 size={24} className="text-red-500" />
                    </div>
                    <DialogTitle className="text-[18px] font-semibold text-gray-800">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-gray-500 text-center">
                        {description}
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
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        className="flex-1 bg-primary"
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? "Deleting..." : "Delete"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}