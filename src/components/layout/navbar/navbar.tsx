"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import Sidebar from "@/components/layout/sidebar/Sidebar";
import { SearchBar } from "./search-bar";
import NotificationBell from "./notification";
import ProfileSection from "./profile-section";
import RestaurantPicker from "@/components/common/RestaurantPicker";
import LanguageSelector from "@/components/layout/navbar/LanguageSelector";

export function Navbar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const t = useTranslations("navbar");

  return (
    <>
      <nav className="relative z-30 w-full overflow-x-hidden bg-white px-3 py-2 md:overflow-visible md:px-[20px] md:py-0 md:pl-[2px]">
        <div className="space-y-2 md:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label={t("openSidebar")}
              className="inline-flex size-10 items-center justify-center rounded-[var(--brand-button-radius)] bg-primary/10 text-primary xl:hidden"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>

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
            <button
              type="button"
              aria-label={t("openSidebar")}
              className="inline-flex size-10 items-center justify-center rounded-[var(--brand-button-radius)] bg-primary/10 text-primary md:ml-4 xl:hidden"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
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

      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 xl:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsSidebarOpen(false)}
          />

          <div className="relative flex flex-col h-full">
            <div className="relative w-72 bg-white shadow-xl h-full">
              <div className="absolute top-3 right-3 z-10">
                <button
                  type="button"
                  aria-label={t("closeSidebar")}
                  className="inline-flex size-9 items-center justify-center rounded-[var(--brand-button-radius)] bg-white/80 text-primary shadow"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>
              <Sidebar onLinkClick={() => setIsSidebarOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
