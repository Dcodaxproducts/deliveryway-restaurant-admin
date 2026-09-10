"use client";

import Header from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

interface HeaderProps {
  title: string;
  description?: string;
  editing: boolean;
  onManageClick: () => void;
}


export default function BranchesHeader({ title, description, editing, onManageClick }: HeaderProps) {
  const t = useTranslations("menu.listing");

  return (
    <Header
      title={title}
      description={description}
      actions={(
        <Button onClick={onManageClick} className="min-h-11 px-6">
          {editing ? t("back") : t("manage")}
        </Button>
      )}
    />
  );
}
