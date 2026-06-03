"use client";

import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export default function EditBranchSectionHeader({
  title,
  description,
  onPrimaryAction,
}: any) {
  const commonT = useTranslations("common");

  return (
    <div className="flex justify-between">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="text-sm text-gray-500">{description}</p>
      </div>

      <Button onClick={onPrimaryAction}>
        {commonT("save")}
      </Button>
    </div>
  );
}
