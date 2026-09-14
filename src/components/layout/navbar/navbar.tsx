"use client";

import { useTranslations } from "next-intl";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { SearchBar } from "./search-bar";
import NotificationBell from "./notification";
import ProfileSection from "./profile-section";
import RestaurantPicker from "@/components/common/RestaurantPicker";
import LanguageSelector from "@/components/layout/navbar/LanguageSelector";

export function Navbar() {
  const t = useTranslations("navbar");

  return (
      <nav className="relative z-30 w-full overflow-x-hidden border-b border-border bg-white px-3 py-2 md:overflow-visible md:px-[20px] md:py-0">
        <div className="space-y-2 md:hidden">
          <div className="flex items-center gap-3">
            <SidebarTrigger
              aria-label={t("openSidebar")}
              className="size-9 text-primary"
            />

            <div className="ml-auto flex shrink-0 items-center gap-1">
              <LanguageSelector />
              <NotificationBell />
              <ProfileSection />
            </div>
          </div>

          <div className="w-full">
            <RestaurantPicker className="w-full" />
          </div>
        </div>

        <div className="hidden min-h-[76px] flex-nowrap items-center justify-between gap-x-3 md:flex">
          <div className="order-1 flex items-center gap-3">
            <SidebarTrigger
              aria-label={t("openSidebar")}
              className="size-9 text-primary"
            />
          </div>

          <SearchBar />

          <div className="order-3 w-full min-w-0 md:order-none md:w-auto md:shrink-0">
            <RestaurantPicker className="w-full md:w-[280px]" />
          </div>

          <div className="order-2 ml-auto flex shrink-0 items-center gap-1 md:order-none lg:gap-2">
            <LanguageSelector />
            <NotificationBell />
            <div className="hidden h-12 w-px bg-primary lg:block" />
            <ProfileSection />
          </div>
        </div>
      </nav>
  );
}
