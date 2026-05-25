type FontClass = {
  className: string;
  variable: string;
};

const createFontClass = (family: string, variable: string): FontClass => ({
  className: `font-${family}`,
  variable,
});

export const onest = createFontClass("onest", "font-onest");
export const barlow = createFontClass("barlow", "font-barlow");
export const poppins = createFontClass("poppins", "font-poppins");
export const arimo = createFontClass("arimo", "font-arimo");
