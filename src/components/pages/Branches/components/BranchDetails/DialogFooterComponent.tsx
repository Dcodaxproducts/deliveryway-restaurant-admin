"use client";

import { DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function DialogFooterComponent({
  closeDialog,
  branchId,
}: {
  closeDialog: () => void;
  branchId?: string;
}) {
  const t = useTranslations("branches");
  const commonT = useTranslations("common");
  const router = useRouter();

  const handleEdit = () => {
    if (!branchId) return;
    router.push(`/branches/edit?branchId=${branchId}`);
  };

  return (
    <DialogFooter className="px-6 pb-6 mt-4 flex gap-3">
      <Button
        variant="outline"
        className="flex-1 h-[42px] rounded-lg"
        onClick={closeDialog}
      >
        {commonT("close")}
      </Button>

      <Button
        className="flex-1 h-[42px] rounded-lg bg-primary text-white"
        onClick={handleEdit}
        disabled={!branchId}
      >
        {t("editDetails")}
      </Button>
    </DialogFooter>
  );
}
