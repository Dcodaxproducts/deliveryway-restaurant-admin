import DeleteDialog from "@/components/common/dialogs/delete-dialog";
import type { ModifierCategory } from "@/types/modifier-categories";

type ModifierCategoryDeleteDialogProps = {
  category: ModifierCategory | null;
  open: boolean;
  errorMessage?: string;
  isLoading: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export default function ModifierCategoryDeleteDialog({
  category,
  open,
  errorMessage,
  isLoading,
  onOpenChange,
  onConfirm,
}: ModifierCategoryDeleteDialogProps) {
  return (
    <div>
      <DeleteDialog
        open={open}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isLoading={isLoading}
        title="Delete modifier category"
        description={
          category
            ? `Are you sure you want to delete "${category.name}"?`
            : "Are you sure you want to delete this modifier category?"
        }
      />

      {open && errorMessage ? (
        <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
      ) : null}
    </div>
  );
}
