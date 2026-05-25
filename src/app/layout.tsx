import type { ReactNode } from "react";

import { arimo, barlow, onest, poppins } from "@/lib/fonts";

import "./globals.css";
import Providers from "./providers";

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${onest.variable} ${barlow.variable} ${poppins.variable} ${arimo.variable} ${onest.className} bg-[#F5F5F5]`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
