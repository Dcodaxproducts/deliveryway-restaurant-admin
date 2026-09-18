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

        <div className="hidden h-[67px] flex-nowrap items-center gap-x-3 py-3 md:flex">
          <div className="flex shrink-0 items-center">
            <SidebarTrigger
              aria-label={t("openSidebar")}
              className="size-9 rounded-lg bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
            />
          </div>

          <SearchBar />

          <div className="w-full min-w-0 md:w-auto md:shrink-0">
            <RestaurantPicker className="w-full md:w-[220px] xl:w-[280px]" />
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1 lg:gap-2">
            <LanguageSelector />
            <NotificationBell />
            <div className="hidden h-8 w-px bg-primary/50 lg:block" />
            <ProfileSection />
          </div>
        </div>
      </nav>
  );
}
