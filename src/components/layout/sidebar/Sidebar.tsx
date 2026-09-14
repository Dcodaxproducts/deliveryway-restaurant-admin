"use client";

import type { ReactElement } from "react";
import { Suspense, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  LogOut,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { menuItems, MenuItem, type SidebarRole } from "@/config/sidebarItems";
import { useAuth } from "@/hooks/useAuth";
import {
  getStaffDefaultRedirectPath,
  hasStaffPermission,
  isStaffRole,
} from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

interface SidebarItemProps {
  item: MenuItem;
  isActive: boolean;
  isOpen?: boolean;
  onOpenChange?: () => void;
  onLinkClick?: () => void;
  collapsed?: boolean;
  onExpand?: () => void;
  isActiveRoute: (href?: string, children?: MenuItem[]) => boolean;
}

const SidebarItem = ({
  item,
  isActive,
  isOpen = false,
  onOpenChange,
  onLinkClick,
  collapsed = false,
  onExpand,
  isActiveRoute,
}: SidebarItemProps): ReactElement => {
  const t = useTranslations("navigation");
  const Icon = item.icon;
  const isDashboard = item.title === "Dashboard";
  const hasChildren = Boolean(item.children?.length);
  const label = item.labelKey ? t(item.labelKey) : item.title;

  if (hasChildren) {
    const parent = (
      <button
        type="button"
        aria-expanded={collapsed ? false : isOpen}
        aria-label={collapsed ? label : undefined}
        onClick={() => {
          if (collapsed) onExpand?.();
          onOpenChange?.();
        }}
        className={`flex w-full items-center transition-colors ${
          collapsed ? "justify-center px-2" : "justify-between px-6"
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
              isActive ? "bg-primary text-white" : "bg-[#F9FAFB] text-primary"
            }`}
          >
            <Icon size={20} strokeWidth={2.2} />
          </div>

          {!collapsed && (
            <span
              className={`truncate text-sm ${
                isActive
                  ? "font-medium text-primary"
                  : "text-gray hover:text-primary"
              }`}
            >
              {label}
            </span>
          )}
        </div>

        {!collapsed &&
          (isOpen ? (
            <ChevronDown size={18} className="shrink-0 text-primary" />
          ) : (
            <ChevronRight size={18} className="shrink-0 text-primary" />
          ))}
      </button>
    );

    return (
      <div className={isDashboard ? "mb-5 mt-5" : "mb-2.5"}>
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>{parent}</TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              {label}
            </TooltipContent>
          </Tooltip>
        ) : (
          parent
        )}

        {isOpen && !collapsed && (
          <div className="mt-2 space-y-1">
            {item.children?.map((child) => {
              const ChildIcon = child.icon;
              const childActive = isActiveRoute(child.href, child.children);
              const childLabel = child.labelKey
                ? t(child.labelKey)
                : child.title;

              return (
                <Link
                  key={child.title}
                  href={child.href ?? "#"}
                  onClick={onLinkClick}
                  className={`flex items-center gap-3 pl-16 pr-6 py-2.5 text-sm transition-colors ${
                    childActive
                      ? "text-primary font-medium"
                      : "text-gray hover:text-primary"
                  }`}
                >
                  {ChildIcon && (
                    <div className="flex items-center justify-center size-8 rounded-lg shrink-0 bg-[#F9FAFB] text-primary">
                      <ChildIcon size={16} strokeWidth={2.2} />
                    </div>
                  )}

                  <span className="truncate">{childLabel}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const link = (
    <Link
      href={item.href ?? "#"}
      onClick={onLinkClick}
      aria-label={collapsed ? label : undefined}
      className={`mb-2.5 flex items-center gap-3 transition-colors ${
        collapsed ? "justify-center px-2" : "px-6"
      } ${
        isDashboard ? "mb-5 mt-5" : ""
      }`}
    >
      <div
        className={`flex items-center justify-center size-10 rounded-xl shrink-0 ${
          isActive ? "bg-primary text-white" : "bg-[#F9FAFB] text-primary"
        }`}
      >
        <Icon size={20} strokeWidth={2.2} />
      </div>

      {!collapsed && (
        <span
          className={`truncate text-sm ${
            isActive
              ? "font-medium text-primary"
              : "text-gray hover:text-primary"
          }`}
        >
          {label}
        </span>
      )}
    </Link>
  );

  return collapsed ? (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        {label}
      </TooltipContent>
    </Tooltip>
  ) : (
    link
  );
};

const getSidebarCta = (
  user: ReturnType<typeof useAuth>["user"],
  role: ReturnType<typeof useAuth>["role"],
  isBranchAdmin: boolean,
): {
  href: string;
  labelKey:
    | "myBranchCta"
    | "addMenuCta"
    | "manageBranchCta"
    | "manageOrdersCta"
    | "openPosCta"
    | "accountSettingsCta";
} => {
  if (isBranchAdmin)
    return { href: "/branch-workspace", labelKey: "myBranchCta" };

  if (isStaffRole(role, user?.actorType)) {
    const href = getStaffDefaultRedirectPath(user);

    if (href === "/branches") return { href, labelKey: "manageBranchCta" };
    if (href === "/orders") return { href, labelKey: "manageOrdersCta" };
    if (href === "/pos") return { href, labelKey: "openPosCta" };
    if (href === "/")
      return { href: "/profile", labelKey: "accountSettingsCta" };

    return { href, labelKey: "addMenuCta" };
  }

  return { href: "/menu?create=true", labelKey: "addMenuCta" };
};

function SidebarContent({
  onLinkClick,
  collapsed = false,
  onCollapsedChange,
}: {
  onLinkClick?: () => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}): ReactElement {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations("navigation");
  const { user, role, isBranchAdmin, logout } = useAuth();
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const [menuState, setMenuState] = useState<{
    routeKey: string;
    openKey: string | null;
  }>({ routeKey, openKey: null });
  const openMenuKey = menuState.routeKey === routeKey ? menuState.openKey : null;

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

  const filterAllowedItems = (items: MenuItem[]): MenuItem[] => {
    return items
      .filter(isItemAllowed)
      .map((item) => ({
        ...item,
        children: item.children?.filter(isItemAllowed),
      }))
      .filter((item) => !item.children || item.children.length > 0);
  };

  const allowedItems = filterAllowedItems(menuItems);
  const mainItems = allowedItems.filter((i) => i.section === "main");
  const accountItems = allowedItems.filter((i) => i.section === "account");

  const isActiveRoute = (href?: string, children?: MenuItem[]): boolean => {
    if (!pathname) return false;

    if (children?.length) {
      const hasActiveChild = children.some((child) =>
        isActiveRoute(child.href, child.children),
      );

      if (hasActiveChild) return true;
    }

    if (!href) return false;

    const [hrefPath, hrefQuery = ""] = href.split("?");
    const hrefSearchParams = new URLSearchParams(hrefQuery);
    const hrefTab = hrefSearchParams.get("tab");

    if (hrefPath === "/") {
      return pathname === "/";
    }

    const pathMatches =
      pathname === hrefPath || pathname.startsWith(`${hrefPath}/`);

    if (!pathMatches) {
      return false;
    }

    if (hrefTab) {
      const currentTab = searchParams.get("tab") || "all";
      return currentTab === hrefTab;
    }

    return true;
  };

  const handleLinkClick = (): void => {
    setMenuState({ routeKey, openKey: null });
    onLinkClick?.();
  };

  const handleLogout = (): void => {
    logout();
    toast.success(t("logoutSuccess"));

    setTimeout(() => {
      router.push("/login");
    }, 500);
  };

  return (
    <aside
      data-collapsed={collapsed}
      className={`relative flex h-full flex-col overflow-y-auto overscroll-contain bg-white transition-[width] duration-200 motion-reduce:transition-none xl:overflow-y-hidden xl:hover:overflow-y-auto ${
        collapsed ? "w-20" : "w-72"
      }`}
    >
      {onCollapsedChange && (
        <button
          type="button"
          aria-label={t(collapsed ? "expandSidebar" : "collapseSidebar")}
          aria-expanded={!collapsed}
          onClick={() => onCollapsedChange(!collapsed)}
          className="absolute right-3 top-3 z-10 inline-flex size-9 items-center justify-center rounded-xl border border-border bg-white text-primary shadow-sm transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {collapsed ? (
            <PanelLeftOpen size={18} />
          ) : (
            <PanelLeftClose size={18} />
          )}
        </button>
      )}

      <nav className="flex min-h-full flex-col px-0 pt-14">
        {mainItems.map((item) => (
          <SidebarItem
            key={item.title}
            item={item}
            isActive={isActiveRoute(item.href, item.children)}
            isOpen={openMenuKey === item.title}
            onOpenChange={() =>
              setMenuState({
                routeKey,
                openKey: openMenuKey === item.title ? null : item.title,
              })
            }
            onLinkClick={handleLinkClick}
            collapsed={collapsed}
            onExpand={() => onCollapsedChange?.(false)}
            isActiveRoute={isActiveRoute}
          />
        ))}

        {collapsed ? (
          <div className="mx-4 mt-5 border-t border-border" />
        ) : (
          <div className="mt-5 px-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
              {t("accountSettings")}
            </p>
          </div>
        )}

        <div className="mt-5">
          {accountItems.map((item) => (
            <SidebarItem
              key={item.title}
              item={item}
              isActive={isActiveRoute(item.href, item.children)}
              isOpen={openMenuKey === item.title}
              onOpenChange={() =>
                setMenuState({
                  routeKey,
                  openKey: openMenuKey === item.title ? null : item.title,
                })
              }
              onLinkClick={handleLinkClick}
              collapsed={collapsed}
              onExpand={() => onCollapsedChange?.(false)}
              isActiveRoute={isActiveRoute}
            />
          ))}
        </div>

        <div className={`mt-auto pb-5 ${collapsed ? "px-2 pt-8" : "px-5 pt-28"}`}>
          {!collapsed && (
            <div
              className="relative rounded-2xl px-4 pt-14 pb-4 text-white"
              style={{
                backgroundImage: "url('/href_background.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="absolute -top-10 left-1/2 -translate-x-1/2">
                <Image
                  src="/user_logo.png"
                  alt={t("supportAlt")}
                  width={90}
                  height={90}
                  className="drop-shadow-md"
                />
              </div>

              <div className="text-left mb-4">
                <p className="text-base font-semibold">{t("needHelp")}</p>
                <p className="text-sm opacity-90">{t("checkDocs")}</p>
              </div>

              <Button
                size="sm"
                className="w-full bg-white text-primary hover:bg-white/90 font-semibold"
                onClick={() =>
                  router.push(getSidebarCta(user, role, isBranchAdmin).href)
                }
              >
                {t(getSidebarCta(user, role, isBranchAdmin).labelKey)}
              </Button>
            </div>
          )}

          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  aria-label={t("logout")}
                  className="mt-4 flex w-full items-center justify-center px-0 text-primary hover:bg-primary/10"
                  onClick={handleLogout}
                >
                  <div className="flex size-10 items-center justify-center rounded-xl bg-[#F9FAFB]">
                    <LogOut size={18} />
                  </div>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {t("logout")}
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              className="mt-4 flex w-full items-center justify-start gap-3 text-primary hover:bg-primary/10"
              onClick={handleLogout}
            >
              <div className="size-10 rounded-xl bg-[#F9FAFB] flex items-center justify-center">
                <LogOut size={18} />
              </div>
              <span className="text-sm font-semibold">{t("logout")}</span>
            </Button>
          )}
        </div>
      </nav>
    </aside>
  );
}

export function Sidebar({
  onLinkClick,
  collapsed = false,
  onCollapsedChange,
}: {
  onLinkClick?: () => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}): ReactElement {
  return (
    <Suspense
      fallback={
        <aside className={`h-full bg-white ${collapsed ? "w-20" : "w-72"}`} />
      }
    >
      <SidebarContent
        onLinkClick={onLinkClick}
        collapsed={collapsed}
        onCollapsedChange={onCollapsedChange}
      />
    </Suspense>
  );
}
