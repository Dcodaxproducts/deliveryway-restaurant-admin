"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import {
  User,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const USER_DATA = {
  name: "Arnold Smith",
  email: "arnoldsmith@gmail.com",
  initials: "AS",
  avatar: "/profile.jpg",
};

export default function ProfileSection() {
  const router = useRouter();
const { user, loading } = useAuth();

  const navigate = (path: string) => {
    router.push(path);
  };
const handleLogout = () => {
  localStorage.removeItem("auth");

  toast.success("Logged out successfully");

  setTimeout(() => {
    router.push("/login");
  }, 500);
};
  return (
    <DropdownMenu>
      <div className="relative">
        {/* ================= ORIGINAL ROW (UNCHANGED) ================= */}
        <Button
          variant={null}
          className="flex justify-between items-center lg:pl-[25px] gap-[24px] py-2 rounded-lg h-auto"
        >
          <div className="flex flex-col items-start justify-center">
            {/* Hide 'Hello' and 'User Name' on mobile */}
            <span className="lg:text-base text-muted-foreground hidden lg:block">Hello,</span>
            <span className="lg:text-base font-semibold text-foreground hidden lg:block">
              {user?.profile.firstName} {user?.profile.lastName}
            </span>
          </div>

          {/* Avatar = Trigger */}
          <DropdownMenuTrigger asChild>
            <Avatar className="w-10 h-10 lg:w-13 lg:h-13 cursor-pointer">
              <Image
                src={USER_DATA.avatar}
                alt={USER_DATA.name}
                width={56}
                height={56}
                quality={90}
                priority
                className="aspect-square object-cover w-full h-full"
              />
              <AvatarFallback>{USER_DATA.initials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
        </Button>

        {/* ================= DROPDOWN ================= */}
        <DropdownMenuContent
          align="end"
          sideOffset={12}
          className="w-[280px] rounded-2xl border border-gray-100 shadow-xl p-0 mt-4"
        >
          {/* User Info Header */}
          <div className="flex items-center gap-3 py-4 px-5 bg-[#F9FAFB] rounded-t-2xl">
            <Avatar className="w-12 h-12">
              <Image
                src={USER_DATA.avatar}
                alt={USER_DATA.name}
                width={48}
                height={48}
                className="object-cover"
              />
              <AvatarFallback>{USER_DATA.initials}</AvatarFallback>
            </Avatar>

            <div className="flex flex-col">
              <span className="font-semibold text-sm">
                {user?.profile.firstName} {user?.profile.lastName}
              </span>
              <span className="text-xs text-gray-500">
                {user?.email}
              </span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <MenuItem
              icon={<User size={18} />}
              label="My Profile"
              onClick={() => navigate("/profile")}
            />
            <MenuItem
              icon={<Settings size={18} />}
              label="Account Settings"
              onClick={() => navigate("/live-chat")}
            />
            <MenuItem
              icon={<HelpCircle size={18} />}
              label="Help Center"
              onClick={() => navigate("/live-chat")}
            />
          </div>

          <DropdownMenuSeparator className="mx-4" />

          {/* Logout */}
          <DropdownMenuItem
            onClick={handleLogout}
            className="mx-2 my-2 flex items-center gap-3 px-3 py-3 text-sm text-red-600 rounded-xl focus:bg-red-50 cursor-pointer"
          >
            <LogOut size={18} color="rgba(255, 0, 0, 0.8)" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </div>
    </DropdownMenu>
  );
}

/* ================= MENU ITEM ================= */

function MenuItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <DropdownMenuItem
      onClick={onClick}
      className="flex items-center justify-between px-5 py-3 text-sm cursor-pointer focus:bg-gray-50"
    >
      <div className="flex items-center gap-3 text-gray-700">
        {icon}
        {label}
      </div>
      <ChevronRight size={16} className="text-gray-400" />
    </DropdownMenuItem>
  );
}
