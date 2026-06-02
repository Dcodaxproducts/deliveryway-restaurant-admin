"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import Sidebar from "@/components/layout/sidebar/Sidebar";
import { SearchBar } from "./search-bar";
import NotificationBell from "./notification";
import ProfileSection from "./profile-section";
import RestaurantPicker from "@/components/common/RestaurantPicker";

export function Navbar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      <nav className="relative z-30 w-full bg-white px-[20px] pl-[2px]">
        <div className="h-[76px] flex items-center justify-between gap-3">
          
          {/* LEFT */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="ml-4 inline-flex size-10 items-center justify-center rounded-[var(--brand-button-radius)] bg-primary/10 text-primary xl:hidden"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>

          </div>

          {/* CENTER */}
          <SearchBar />
          <RestaurantPicker />
          {/* RIGHT */}
          <div className="flex items-center gap-0 lg:gap-2">
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
