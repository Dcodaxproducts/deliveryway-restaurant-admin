"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  HelpCircle,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { getAvatarUrl, getDisplayName, getInitials } from "@/lib/auth";

export default function ProfileSection() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const displayName = getDisplayName(user);
  const initials = getInitials(user);
  const avatarUrl = getAvatarUrl(user);

  const navigate = (path: string) => {
    router.push(path);
  };
  const handleLogout = () => {
    logout();

    toast.success("Logged out successfully");

    setTimeout(() => {
      router.push("/login");
    }, 500);
  };
  return (
    <DropdownMenu>
      <div className="relative">
        <Button
          variant={null}
          className="flex justify-between items-center lg:pl-[25px] gap-[24px] py-2 rounded-lg h-auto"
        >
          <div className="flex flex-col items-start justify-center">
            {/* Hide 'Hello' and 'User Name' on mobile */}
            <span className="lg:text-base text-muted-foreground hidden lg:block">Hello,</span>
            <span className="lg:text-base font-semibold text-foreground hidden lg:block">
              {displayName}
            </span>
          </div>

          {/* Avatar = Trigger */}
          <DropdownMenuTrigger asChild>
            <Avatar className="w-10 h-10 lg:w-13 lg:h-13 cursor-pointer">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
        </Button>

        <DropdownMenuContent
          align="end"
          sideOffset={12}
          className="w-[280px] rounded-2xl border border-gray-100 shadow-xl p-0 mt-4"
        >
          {/* User Info Header */}
          <div className="flex items-center gap-3 py-4 px-5 bg-[#F9FAFB] rounded-t-2xl">
            <Avatar className="w-12 h-12">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>

            <div className="flex flex-col">
              <span className="font-semibold text-sm">
                {displayName}
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
              icon={<HelpCircle size={18} />}
              label="Help Center"
              onClick={() => navigate("/live-chat")}
            />
          </div>

          <DropdownMenuSeparator className="mx-4" />

          {/* Logout */}
          <DropdownMenuItem
            onClick={handleLogout}
            className="mx-2 my-2 flex items-center gap-3 px-3 py-3 text-sm text-red-600 rounded-xl cursor-pointer hover:bg-red-50 hover:text-red-700 focus:bg-red-50 focus:text-red-700 [&_svg]:text-red-600"
          >
            <LogOut size={18} />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </div>
    </DropdownMenu>
  );
}


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
