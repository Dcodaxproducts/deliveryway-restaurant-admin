"use client";

import PageHeader from "@/components/common/PageHeader";
import { PageTabs } from "@/components/common/PageTabs";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Layers3, ListTree, Plus, Tags } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isBranchAdmin } = useAuth();

  const [createMenu, setCreateMenu] = useState(false);

  useEffect(() => {
    if (searchParams.get("create") === "true") {
      setCreateMenu(true);
    }
  }, [searchParams]);

  const navigationActions = [
    { label: t("overview"), href: "/menu", icon: LayoutGrid },
    ...(!isBranchAdmin
      ? [{ label: t("modifiers"), href: "/menu/modifier", icon: Layers3 }]
      : []),
    { label: t("categories"), href: "/menu/categories", icon: Tags },
    { label: t("items"), href: "/menu/items", icon: ListTree },
  ];
  const activeNavigation =
    navigationActions
      .filter(({ href }) => href !== "/menu")
      .find(({ href }) => pathname.startsWith(href))?.href ?? "/menu";

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        actions={
          !isBranchAdmin ? (
            <Button
              type="button"
              className="shadow-[var(--ui-shadow-xs)]"
              onClick={() => setCreateMenu(true)}
            >
              <Plus aria-hidden="true" className="size-4" />
              {t("addMenu")}
            </Button>
          ) : null
        }
        tabs={
          <PageTabs
            value={activeNavigation}
            ariaLabel={t("menuNavigation")}
            options={navigationActions.map(({ label, href, icon: Icon }) => ({
              value: href,
              label,
              icon: <Icon aria-hidden="true" className="size-4" />,
            }))}
            onValueChange={(href) => router.push(href)}
            className="w-fit"
          />
        }
      />

      <CreateMenuModal open={createMenu} onOpenChange={setCreateMenu} />
    </>
  );
}
