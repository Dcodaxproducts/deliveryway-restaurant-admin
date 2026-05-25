"use client";

import { Button } from "@/components/ui/button";

export default function EditBranchSectionHeader({
  title,
  description,
  onPrimaryAction,
}: any) {
  return (
    <div className="flex justify-between">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="text-sm text-gray-500">{description}</p>
      </div>

      <Button onClick={onPrimaryAction}>
        Save
      </Button>
    </div>
  );
}