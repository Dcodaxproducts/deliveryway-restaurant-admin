import type { ReactNode } from "react";
import type { Metadata } from "next";

import { arimo, barlow, onest, poppins } from "@/lib/fonts";

import "./globals.css";
import { Providers } from "./providers";

type RootLayoutProps = {
  children: ReactNode;
};

export const metadata: Metadata = {
  title: {
    default: "Restaurant Admin",
    template: "%s | Restaurant Admin",
  },
  applicationName: "Restaurant Admin",
  icons: {
    icon: "/feastflow-logo.png",
    shortcut: "/feastflow-logo.png",
    apple: "/feastflow-logo.png",
  },
  other: {
    google: "notranslate",
  },
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="de"
      className="notranslate"
      translate="no"
      suppressHydrationWarning
    >
      <body
        className={`${onest.variable} ${barlow.variable} ${poppins.variable} ${arimo.variable} ${onest.className} bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
