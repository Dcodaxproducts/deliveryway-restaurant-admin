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
    <main className="grid min-h-[100dvh] grid-cols-1 overflow-hidden bg-[#f7f5f2] lg:grid-cols-[minmax(0,1.04fr)_minmax(520px,0.96fr)]">
      <div className="relative hidden overflow-hidden lg:block" aria-hidden="true">
        <Image
          src="/login_banner.webp"
          alt=""
          fill
          sizes="52vw"
          className="scale-[1.01] object-cover"
          priority
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,4,1,0.06),rgba(3,4,1,0.32))]" />
      </div>

      <section
        aria-labelledby="partner-login-title"
        className="relative flex items-center justify-center px-5 py-8 sm:px-10 lg:bg-white lg:px-14"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top_right,rgba(193,0,10,0.08),transparent_64%)] lg:hidden" />
        {children}
      </section>
    </main>
  );
}
