import DeleteDialog from "@/components/common/dialogs/delete-dialog";
import type { Cuisine } from "@/types/cuisines";

type CuisineDeleteDialogProps = {
  cuisine: Cuisine | null;
  open: boolean;
  errorMessage?: string;
  isLoading: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export default function CuisineDeleteDialog({
  cuisine,
  open,
  errorMessage,
  isLoading,
  onOpenChange,
  onConfirm,
}: CuisineDeleteDialogProps) {
  return (
    <div>
      <DeleteDialog
        open={open}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isLoading={isLoading}
        title="Delete cuisine"
        description={
          cuisine
            ? `Are you sure you want to delete "${cuisine.name}"?`
            : "Are you sure you want to delete this cuisine?"
        }
      />

      {open && errorMessage ? (
        <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
      ) : null}
    </div>
  );
}
