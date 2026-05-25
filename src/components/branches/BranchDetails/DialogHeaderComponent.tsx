import { DialogHeader } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function DialogHeaderComponent({
  title,
  badgeText,
  branchId,
  createdAt,
  updatedAt,
}: {
  title: string;
  badgeText: string;
  branchId: string;
  createdAt?: string;
  updatedAt?: string;
}) {
  return (
    <DialogHeader className="space-y-2 text-center">
      <h2 className="text-xl font-semibold text-center">{title}</h2>

      <div className="flex justify-center">
        <Badge className="bg-green-100 text-green-700">
          {badgeText}
        </Badge>
      </div>

      <p className="text-xs text-muted-foreground  text-center">
        ID: #{branchId}
      </p>

      {createdAt && (
        <p className="text-xs text-muted-foreground  text-center">
          Created: {new Date(createdAt).toLocaleString()}
        </p>
      )}

      {updatedAt && (
        <p className="text-xs text-muted-foreground">
          Updated: {new Date(updatedAt).toLocaleString()}
        </p>
      )}
    </DialogHeader>
  );
}