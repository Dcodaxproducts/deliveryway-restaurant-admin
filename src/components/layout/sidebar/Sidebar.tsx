"use client";

import type { ReactElement } from "react";
import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import BrandLogo from "@/components/common/BrandLogo";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { menuItems, MenuItem, type SidebarRole } from "@/config/sidebarItems";
import { useAuth } from "@/hooks/useAuth";
import {
  hasStaffPermission,
  isStaffRole,
} from "@/lib/auth";

type PartnerSidebarItemProps = {
  item: MenuItem;
  isActiveRoute: (href?: string, children?: MenuItem[]) => boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: () => void;
};

function PartnerSidebarItem({
  item,
  isActiveRoute,
  open,
  onOpenChange,
  onNavigate,
}: PartnerSidebarItemProps): ReactElement {
  const t = useTranslations("navigation");
  const { state, setOpen } = useSidebar();
  const Icon = item.icon;
  const label = item.labelKey ? t(item.labelKey) : item.title;
  const isActive = isActiveRoute(item.href, item.children);

  if (!item.children?.length) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive} tooltip={label}>
          <Link href={item.href ?? "#"} onClick={onNavigate}>
            <Icon />
            <span>{label}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <Collapsible
      asChild
      open={open}
      onOpenChange={(nextOpen) => {
        if (state === "collapsed") setOpen(true);
        onOpenChange(nextOpen);
      }}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton isActive={isActive} tooltip={label}>
            <Icon />
            <span>{label}</span>
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.children.map((child) => {
              const ChildIcon = child.icon;
              const childLabel = child.labelKey
                ? t(child.labelKey)
                : child.title;

              return (
                <SidebarMenuSubItem key={child.href ?? child.title}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={isActiveRoute(child.href, child.children)}
                  >
                    <Link href={child.href ?? "#"} onClick={onNavigate}>
                      {ChildIcon ? <ChildIcon /> : null}
                      <span>{childLabel}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

function PartnerSidebarContent(): ReactElement {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations("navigation");
  const { user, role, logout } = useAuth();
  const { setOpenMobile } = useSidebar();
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const [menuState, setMenuState] = useState<{
    routeKey: string;
    openKey: string | null;
  }>({ routeKey: "", openKey: null });

  const isSidebarRole = (value?: string | null): value is SidebarRole =>
    value === "BUSINESS_ADMIN" ||
    value === "RESTAURANT_ADMIN" ||
    value === "BRANCH_ADMIN" ||
    value === "STAFF";

  const isItemAllowed = (item: MenuItem): boolean => {
    if (!item.roles?.length) return true;
    if (isStaffRole(role, user?.actorType)) {
      if (item.href === "/branch-workspace") return false;
      if (item.href === "/profile") return true;
      return Boolean(
        item.permissionAccesses?.length &&
          hasStaffPermission(user, item.permissionAccesses),
      );
    }

    return isSidebarRole(role) && item.roles.includes(role);
  };

  const filterAllowedItems = (items: MenuItem[]): MenuItem[] =>
    items
      .filter(isItemAllowed)
      .map((item) => ({
        ...item,
        children: item.children?.filter(isItemAllowed),
      }))
      .filter((item) => !item.children || item.children.length > 0);

  const allowedItems = filterAllowedItems(menuItems);
  const mainItems = allowedItems.filter((item) => item.section === "main");
  const accountItems = allowedItems.filter((item) => item.section === "account");

  const isActiveRoute = (href?: string, children?: MenuItem[]): boolean => {
    if (!pathname) return false;
    if (children?.some((child) => isActiveRoute(child.href, child.children))) {
      return true;
    }
    if (!href) return false;

    const [hrefPath, hrefQuery = ""] = href.split("?");
    const hrefTab = new URLSearchParams(hrefQuery).get("tab");
    const pathMatches =
      hrefPath === "/"
        ? pathname === "/"
        : pathname === hrefPath || pathname.startsWith(`${hrefPath}/`);

    if (!pathMatches) return false;
    if (!hrefTab) return true;

    return (searchParams.get("tab") || "all") === hrefTab;
  };

  const openMenuKey =
    menuState.routeKey === routeKey
      ? menuState.openKey
      : allowedItems.find((item) =>
          item.children?.some((child) =>
            isActiveRoute(child.href, child.children),
          ),
        )?.title ?? null;

  const handleNavigate = (): void => {
    setOpenMobile(false);
  };

  const handleLogout = (): void => {
    logout();
    toast.success(t("logoutSuccess"));
    setTimeout(() => router.push("/login"), 500);
  };

  const renderGroup = (items: MenuItem[]) => (
    <SidebarMenu>
      {items.map((item) => (
        <PartnerSidebarItem
          key={item.href ?? item.title}
          item={item}
          isActiveRoute={isActiveRoute}
          open={openMenuKey === item.title}
          onOpenChange={(open) =>
            setMenuState({
              routeKey,
              openKey: open ? item.title : null,
            })
          }
          onNavigate={handleNavigate}
        />
      ))}
    </SidebarMenu>
  );

  return (
    <ShadcnSidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="FeastFlow">
              <Link href="/" onClick={handleNavigate}>
                <BrandLogo
                  showName={false}
                  className="contents"
                  imageClassName="size-8 rounded-md"
                />
                <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">FeastFlow</span>
                  <span className="truncate text-xs text-sidebar-foreground/70">
                    Partner
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="[scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <SidebarGroup>
          <SidebarGroupLabel>{t("platform")}</SidebarGroupLabel>
          <SidebarGroupContent>{renderGroup(mainItems)}</SidebarGroupContent>
        </SidebarGroup>
        {accountItems.length ? (
          <SidebarGroup>
            <SidebarGroupLabel>{t("accountSettings")}</SidebarGroupLabel>
            <SidebarGroupContent>{renderGroup(accountItems)}</SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={t("logout")} onClick={handleLogout}>
              <LogOut />
              <span>{t("logout")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </ShadcnSidebar>
  );
}

export function Sidebar(): ReactElement {
  return (
    <Suspense fallback={null}>
      <PartnerSidebarContent />
    </Suspense>
  );
}
