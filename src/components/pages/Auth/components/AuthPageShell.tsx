import Image from "next/image";
import type { ReactNode } from "react";

export const AUTH_CARD_CLASS = "w-full max-w-[480px] rounded-[24px] border border-gray-200 px-8 py-10";
export const AUTH_TITLE_CLASS = "text-center text-[26px] font-semibold text-[#EC5834]";
export const AUTH_DESCRIPTION_CLASS = "mt-3 text-center text-sm leading-relaxed text-gray-500";
export const AUTH_DIVIDER_LINE_CLASS = "h-px flex-1 bg-gray-300";
export const AUTH_PRIMARY_SUBMIT_BUTTON_CLASS = "h-[52px] w-full rounded-[14px] bg-primary text-base hover:bg-red-800";

type AuthPageShellProps = {
  children: ReactNode;
};

export default function AuthPageShell({ children }: AuthPageShellProps) {
  return (
    <div className="grid min-h-screen grid-cols-1 bg-white lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <Image
          src="/login_banner.jpg"
          alt="Login Banner"
          fill
          className="object-cover"
          priority
        />
      </div>

      <div className="flex items-center justify-center px-6">
        {children}
      </div>
    </div>
  );
}
