"use client";

import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, ChevronDown, ChevronRight } from "lucide-react";
import { menuItems, MenuItem } from "@/config/sidebarItems";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SidebarItemProps {
  item: MenuItem;
  isActive: boolean;
  onLinkClick?: () => void;
  isActiveRoute: (href?: string, children?: MenuItem[]) => boolean;
}

const SidebarItem = ({
  item,
  isActive,
  onLinkClick,
  isActiveRoute,
}: SidebarItemProps): ReactElement => {
  const Icon = item.icon;
  const isDashboard = item.title === "Dashboard";
  const hasChildren = Boolean(item.children?.length);

  const [open, setOpen] = useState<boolean>(isActive);

  useEffect(() => {
    if (isActive) {
      setOpen(true);
    }
  }, [isActive]);

  if (hasChildren) {
    return (
      <div className={isDashboard ? "mb-5 mt-5" : "mb-2.5"}>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="w-full flex items-center justify-between px-6 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`flex items-center justify-center size-10 rounded-xl shrink-0 ${
                isActive ? "bg-primary text-white" : "bg-[#F9FAFB] text-primary"
              }`}
            >
              <Icon size={20} strokeWidth={2.2} />
            </div>

            <span
              className={`text-sm truncate ${
                isActive
                  ? "text-primary font-medium"
                  : "text-gray hover:text-primary"
              }`}
            >
              {item.title}
            </span>
          </div>

          {open ? (
            <ChevronDown size={18} className="text-primary shrink-0" />
          ) : (
            <ChevronRight size={18} className="text-primary shrink-0" />
          )}
        </button>

        {open && (
          <div className="mt-2 space-y-1">
            {item.children?.map((child) => {
              const ChildIcon = child.icon;
              const childActive = isActiveRoute(child.href, child.children);

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

                  <span className="truncate">{child.title}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href ?? "#"}
      onClick={onLinkClick}
      className={`flex items-center gap-3 px-6 transition-colors mb-2.5 ${
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

      <span
        className={`text-sm truncate ${
          isActive
            ? "text-primary font-medium"
            : "text-gray hover:text-primary"
        }`}
      >
        {item.title}
      </span>
    </Link>
  );
};

export default function Sidebar({
  onLinkClick,
}: {
  onLinkClick?: () => void;
}): ReactElement {
  const pathname = usePathname();
  const router = useRouter();
  const { role, isBranchAdmin } = useAuth();

  const isItemAllowed = (item: MenuItem): boolean => {
    if (!item.roles?.length) return true;
    return Boolean(role && item.roles.includes(role as any));
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
        isActiveRoute(child.href, child.children)
      );

      if (hasActiveChild) return true;
    }

    if (!href) return false;

    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleLogout = (): void => {
    localStorage.removeItem("auth");
    toast.success("Logged out successfully");

    setTimeout(() => {
      router.push("/login");
    }, 500);
  };

  return (
    <aside className="flex flex-col w-72 bg-white h-full border-r overflow-y-auto">
      <nav className="flex flex-col px-0">
        {mainItems.map((item) => (
          <SidebarItem
            key={item.title}
            item={item}
            isActive={isActiveRoute(item.href, item.children)}
            onLinkClick={onLinkClick}
            isActiveRoute={isActiveRoute}
          />
        ))}

        <div className="mt-5 px-6">
          <p className="text-xs font-semibold tracking-wide text-[#2D3748] uppercase">
            Account Settings
          </p>
        </div>

        <div className="mt-5">
          {accountItems.map((item) => (
            <SidebarItem
              key={item.title}
              item={item}
              isActive={isActiveRoute(item.href, item.children)}
              onLinkClick={onLinkClick}
              isActiveRoute={isActiveRoute}
            />
          ))}
        </div>

        <div className="px-5 pb-5 mt-28">
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
                alt="Support"
                width={90}
                height={90}
                className="drop-shadow-md"
              />
            </div>

            <div className="text-left mb-4">
              <p className="text-base font-semibold">Need help?</p>
              <p className="text-sm opacity-90">Please check our docs</p>
            </div>

            <Button
              size="sm"
              className="w-full bg-white text-primary hover:bg-white/90 font-semibold"
              onClick={() => router.push(isBranchAdmin ? "/branch-workspace" : "/menu?create=true")}
            >
              {isBranchAdmin ? "MY BRANCH" : "ADD MENU"}
            </Button>
          </div>

          <Button
            variant="ghost"
            className="mt-4 flex items-center gap-3 text-primary hover:bg-red-50 w-full justify-start"
            onClick={handleLogout}
          >
            <div className="size-10 rounded-xl bg-[#F9FAFB] flex items-center justify-center">
              <LogOut size={18} />
            </div>
            <span className="text-sm font-semibold">Logout</span>
          </Button>
        </div>
      </nav>
    </aside>
  );
}