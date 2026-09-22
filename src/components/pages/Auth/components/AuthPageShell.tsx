import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const AUTH_CARD_CLASS =
  "auth-viewport-card relative w-full max-w-[440px] rounded-[28px] border border-black/[0.06] bg-white px-5 py-6 shadow-[0_24px_70px_rgba(42,27,20,0.08)] sm:px-9 sm:py-8 lg:border-0 lg:px-0 lg:shadow-none";
export const AUTH_TITLE_CLASS =
  "text-balance text-center text-[26px] font-semibold tracking-[-0.03em] text-gray-950 sm:text-[30px]";
export const AUTH_DESCRIPTION_CLASS =
  "mx-auto mt-2 max-w-[42ch] text-pretty text-center text-sm leading-6 text-gray-600";
export const AUTH_DIVIDER_LINE_CLASS = "h-px flex-1 bg-gray-200";
export const AUTH_PRIMARY_SUBMIT_BUTTON_CLASS =
  "h-[50px] w-full rounded-[12px] text-base shadow-[0_10px_24px_color-mix(in_oklch,var(--primary)_18%,transparent)] active:scale-[0.99]";
export const AUTH_SECONDARY_LINK_CLASS =
  "flex h-[50px] w-full items-center justify-center gap-2 rounded-[12px] border border-gray-300 bg-white text-sm font-medium text-gray-800 transition duration-200 hover:border-primary/35 hover:bg-[#faf8f6] hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-[0.99]";

type AuthPageShellProps = {
  children: ReactNode;
  titleId?: string;
};

export function AuthCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div data-slot="auth-card" className={cn(AUTH_CARD_CLASS, className)}>
      {children}
    </div>
  );
}

export function AuthBrand() {
  return (
    <Image
      src="/feastflow-logo.png"
      alt="FeastFlow"
      width={360}
      height={87}
      className="mx-auto h-auto w-[140px] sm:w-[164px]"
      priority
    />
  );
}

export default function AuthPageShell({
  children,
  titleId = "auth-page-title",
}: AuthPageShellProps) {
  return (
    <main className="grid h-[100dvh] max-h-[100dvh] grid-cols-1 overflow-hidden bg-[#f7f5f2] lg:grid-cols-[minmax(0,1.04fr)_minmax(520px,0.96fr)]">
      <div
        className="relative hidden overflow-hidden lg:block"
        aria-hidden="true"
      >
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
        aria-labelledby={titleId}
        className="relative flex min-h-0 items-center justify-center overflow-hidden px-5 py-3 sm:px-10 lg:bg-white lg:px-14"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top_right,color-mix(in_oklch,var(--primary)_8%,transparent),transparent_64%)] lg:hidden" />
        {children}
      </section>
    </main>
  );
}
