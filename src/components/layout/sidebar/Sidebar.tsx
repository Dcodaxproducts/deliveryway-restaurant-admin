"use client";

import type { ReactElement } from "react";
import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import BrandLogo from "@/components/common/BrandLogo";
import { Button } from "@/components/ui/button";
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
  getStaffDefaultRedirectPath,
  hasStaffPermission,
  isStaffRole,
} from "@/lib/auth";

const primaryNavigationClassName =
  "h-9 text-gray transition-colors hover:bg-primary/10 hover:text-primary data-[active=true]:bg-primary/10 data-[active=true]:font-medium data-[active=true]:text-primary group-data-[collapsible=icon]:justify-center! group-data-[collapsible=icon]:p-0! [&>svg]:size-[20px] [&>svg]:text-primary";

const secondaryNavigationClassName =
  "h-8 text-gray transition-colors hover:bg-primary/10 hover:text-primary data-[active=true]:bg-primary/10 data-[active=true]:font-medium data-[active=true]:text-primary group-data-[collapsible=icon]:justify-center! group-data-[collapsible=icon]:p-0! [&>svg]:size-[20px] [&>svg]:text-primary";

type PartnerSidebarItemProps = {
  item: MenuItem;
  isActiveRoute: (
    href?: string,
    children?: MenuItem[],
    siblings?: MenuItem[],
  ) => boolean;
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
  const itemRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (!open) return;

    const timeoutId = window.setTimeout(() => {
      itemRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }, 220);

    return () => window.clearTimeout(timeoutId);
  }, [open]);

  if (!item.children?.length) {
    return (
      <SidebarMenuItem ref={itemRef}>
        <SidebarMenuButton
          asChild
          isActive={isActive}
          tooltip={label}
          className={primaryNavigationClassName}
        >
          <Link href={item.href ?? "#"} onClick={onNavigate}>
            <Icon />
            <span className="group-data-[collapsible=icon]:hidden">{label}</span>
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
      <SidebarMenuItem ref={itemRef}>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            isActive={isActive}
            tooltip={label}
            className={primaryNavigationClassName}
          >
            <Icon />
            <span className="group-data-[collapsible=icon]:hidden">{label}</span>
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
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
                    isActive={isActiveRoute(
                      child.href,
                      child.children,
                      item.children,
                    )}
                    className={secondaryNavigationClassName}
                  >
                    <Link href={child.href ?? "#"} onClick={onNavigate}>
                      {ChildIcon ? <ChildIcon /> : null}
                      <span className="group-data-[collapsible=icon]:hidden">
                        {childLabel}
                      </span>
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
  if (isBranchAdmin) {
    return { href: "/branch-workspace", labelKey: "myBranchCta" };
  }

  if (isStaffRole(role, user?.actorType)) {
    const href = getStaffDefaultRedirectPath(user);

    if (href === "/branches") return { href, labelKey: "manageBranchCta" };
    if (href === "/orders") return { href, labelKey: "manageOrdersCta" };
    if (href === "/pos") return { href, labelKey: "openPosCta" };
    if (href === "/") {
      return { href: "/profile", labelKey: "accountSettingsCta" };
    }

    return { href, labelKey: "addMenuCta" };
  }

  return { href: "/menu?create=true", labelKey: "addMenuCta" };
};

function PartnerSidebarContent(): ReactElement {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations("navigation");
  const { user, role, isBranchAdmin, logout } = useAuth();
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
  const accountItems = allowedItems.filter(
    (item) => item.section === "account",
  );

  const isActiveRoute = (
    href?: string,
    children?: MenuItem[],
    siblings?: MenuItem[],
  ): boolean => {
    if (!pathname) return false;
    if (
      children?.some((child) =>
        isActiveRoute(child.href, child.children, children),
      )
    ) {
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

    const hasMoreSpecificSibling = siblings?.some((sibling) => {
      if (!sibling.href || sibling.href === href) return false;
      const [siblingPath] = sibling.href.split("?");
      return (
        siblingPath.length > hrefPath.length &&
        (pathname === siblingPath || pathname.startsWith(`${siblingPath}/`))
      );
    });

    if (hasMoreSpecificSibling) return false;
    if (!hrefTab) return true;

    return (searchParams.get("tab") || "all") === hrefTab;
  };

  const activeMenuKey =
    allowedItems.find((item) =>
      item.children?.some((child) =>
        isActiveRoute(child.href, child.children, item.children),
      ),
    )?.title ?? null;
  const openMenuKey =
    menuState.routeKey === routeKey ? menuState.openKey : null;

  const handleNavigate = (): void => {
    setOpenMobile(false);
  };

  const handleLogout = (): void => {
    logout();
    toast.success(t("logoutSuccess"));
    setTimeout(() => router.push("/login"), 500);
  };

  const sidebarCta = getSidebarCta(user, role, isBranchAdmin);

  const renderGroup = (items: MenuItem[]) => (
    <SidebarMenu className="gap-1.5">
      {items.map((item) => (
        <PartnerSidebarItem
          key={item.href ?? item.title}
          item={item}
          isActiveRoute={isActiveRoute}
          open={activeMenuKey === item.title || openMenuKey === item.title}
          onOpenChange={(open) =>
            setMenuState({
              routeKey,
              openKey:
                !open && activeMenuKey === item.title
                  ? item.title
                  : open
                    ? item.title
                    : null,
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
            <SidebarGroupContent>
              {renderGroup(accountItems)}
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
        <div
          data-sidebar-support-card="true"
          className="relative mx-3 mb-3 mt-10 shrink-0 rounded-2xl bg-primary px-4 pb-4 pt-12 text-white group-data-[collapsible=icon]:hidden"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl bg-[url('/href_background.png')] bg-cover bg-center opacity-70"
          />
          <Image
            src="/user_logo.png"
            alt={t("supportAlt")}
            width={82}
            height={82}
            className="absolute -top-9 left-1/2 -translate-x-1/2 drop-shadow-md"
          />
          <div className="relative mb-3 text-left">
            <p className="text-sm font-semibold">{t("needHelp")}</p>
            <p className="text-xs text-white/90">{t("checkDocs")}</p>
          </div>
          <Button
            size="sm"
            className="relative h-8 w-full rounded-full bg-white font-semibold text-primary hover:bg-white/90"
            onClick={() => {
              setOpenMobile(false);
              router.push(sidebarCta.href);
            }}
          >
            {t(sidebarCta.labelKey)}
          </Button>
        </div>
      </SidebarContent>

      <SidebarFooter className="gap-3 border-t border-sidebar-border bg-sidebar p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={t("logout")}
              onClick={handleLogout}
              className="h-9 font-semibold text-primary hover:bg-primary/10 hover:text-primary group-data-[collapsible=icon]:justify-center! group-data-[collapsible=icon]:p-0! [&>svg]:size-[20px] [&>svg]:text-primary"
            >
              <LogOut />
              <span className="group-data-[collapsible=icon]:hidden">
                {t("logout")}
              </span>
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
