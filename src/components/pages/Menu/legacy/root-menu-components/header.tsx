"use client";

import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Layers3, ListTree, Plus, Tags } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import CreateMenuModal from "./CreateMenuModal";
import { useAuth } from "@/hooks/useAuth";
import { useTranslations } from "next-intl";

interface HeaderProps {
  title: string;
  description?: string;
}

export default function BranchesHeader({ title, description }: HeaderProps) {
  const t = useTranslations("menu.header");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isBranchAdmin } = useAuth();

  const [createMenu, setCreateMenu] = useState(false);

  useEffect(() => {
    if (searchParams.get("create") === "true") {
      setCreateMenu(true);
    }
  }, [searchParams]);

  const navigationActions = [
    ...(!isBranchAdmin
      ? [{ label: t("modifiers"), href: "/menu/modifier", icon: Layers3 }]
      : []),
    { label: t("categories"), href: "/menu/categories", icon: Tags },
    { label: t("items"), href: "/menu/items", icon: ListTree },
  ];

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        actions={
          <div className="flex max-w-full flex-nowrap items-center gap-2 overflow-x-auto">
            <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-[var(--ui-radius-compact)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-1 shadow-[var(--ui-shadow-xs)]">
              {navigationActions.map(({ label, href, icon: Icon }) => (
                <Button
                  key={href}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-[var(--ui-text-muted)] hover:bg-[var(--ui-brand-soft)] hover:text-primary"
                  onClick={() => router.push(href)}
                >
                  <Icon aria-hidden="true" className="size-4" />
                  {label}
                </Button>
              ))}
            </div>

            {!isBranchAdmin ? (
              <Button
                type="button"
                size="sm"
                className="shadow-[var(--ui-shadow-xs)]"
                onClick={() => setCreateMenu(true)}
              >
                <Plus aria-hidden="true" className="size-4" />
                {t("addMenu")}
              </Button>
            ) : null}
          </div>
        }
      />

      <CreateMenuModal open={createMenu} onOpenChange={setCreateMenu} />
    </>
  );
}
