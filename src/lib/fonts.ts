import { Onest } from "next/font/google";

type FontClass = {
  className: string;
  variable: string;
};

const createFontClass = (family: string, variable: string): FontClass => ({
  className: `font-${family}`,
  variable,
});

export const onest = Onest({
  subsets: ["latin"],
  variable: "--font-onest",
  display: "swap",
  fallback: ["Onest Fallback", "ui-sans-serif", "system-ui"],
});

export const barlow = createFontClass("barlow", "font-barlow");
export const poppins = createFontClass("poppins", "font-poppins");
export const arimo = createFontClass("arimo", "font-arimo");
