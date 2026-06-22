import { DialogHeader } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatDateTime24 } from "@/lib/date-time-format";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("branches");

  return (
    <DialogHeader className="space-y-2 text-center">
      <h2 className="text-xl font-semibold text-center">{title}</h2>

      <div className="flex justify-center">
        <Badge className="bg-green-100 text-green-700">
          {badgeText}
        </Badge>
      </div>

      <p className="text-xs text-muted-foreground  text-center">
        {t("id")}: #{branchId}
      </p>

      {createdAt && (
        <p className="text-xs text-muted-foreground  text-center">
          {t("created")}: {formatDateTime24({ value: createdAt })}
        </p>
      )}

      {updatedAt && (
        <p className="text-xs text-muted-foreground">
          {t("updated")}: {formatDateTime24({ value: updatedAt })}
        </p>
      )}
    </DialogHeader>
  );
}
