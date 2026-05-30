import type { BrandingThemeMode } from "@/types/branding";
import type { BrandingFormValues } from "@/validations/branding";

type PreviewSectionProps = {
  values: BrandingFormValues;
};

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "DW";

const getButtonRadius = (buttonStyle: string, borderRadius: string) => {
  if (buttonStyle === "pill") {
    return "9999px";
  }

  if (buttonStyle === "square") {
    return "0px";
  }

  return borderRadius;
};

const getPreviewModeLabel = (mode: BrandingThemeMode) => {
  if (mode === "system") {
    return "System preview uses light colors here; dark colors apply automatically for customers who prefer dark mode.";
  }

  return mode === "dark" ? "Dark theme preview" : "Light theme preview";
};

export default function PreviewSection({ values }: PreviewSectionProps) {
  const { restaurant } = values;
  const { branding } = restaurant;
  const { theme } = branding;
  const activeTheme = theme.mode === "dark" ? theme.dark : theme;
  const logoUrl = restaurant.logoUrl || branding.logo.light || branding.assets.logoUrl;
  const buttonRadius = getButtonRadius(theme.buttonStyle, theme.borderRadius);

  return (
    <div className="rounded-lg bg-white p-4 shadow-sm md:p-6">
      <div className="mb-[24px] flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base text-dark">Preview</h3>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {getPreviewModeLabel(theme.mode)}
        </span>
      </div>
      <div
        className="space-y-5 rounded-[18px] border border-gray-200 p-5"
        style={{
          backgroundColor: activeTheme.backgroundColor,
          color: activeTheme.textColor,
          borderRadius: theme.borderRadius,
          fontFamily: theme.fontFamily,
        }}
      >
        <div className="flex flex-wrap items-center gap-4">
          <div
            className="flex h-[58px] min-w-[122px] items-center justify-center overflow-hidden border border-gray-200 bg-white px-3 text-base font-semibold"
            style={{ borderRadius: buttonRadius }}
          >
            {logoUrl ? (
              <div
                aria-label={`${restaurant.name} logo preview`}
                role="img"
                className="h-10 w-[142px] bg-contain bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${logoUrl})` }}
              />
            ) : (
              <span style={{ color: activeTheme.secondaryColor }}>{getInitials(restaurant.name)}</span>
            )}
          </div>
          <div>
            <h1
              className="text-2xl font-bold md:text-[37px]"
              style={{ color: activeTheme.primaryColor, fontFamily: theme.headingFontFamily }}
            >
              {restaurant.name || "Restaurant Name"}
            </h1>
            <p className="text-sm" style={{ color: activeTheme.secondaryColor }}>
              {restaurant.tagline || "Fresh orders, fast delivery, memorable hospitality."}
            </p>
          </div>
        </div>

        <p className="max-w-3xl text-base leading-7">
          {restaurant.bio || "Experience the finest dining with a carefully curated menu. Order online for delivery or pickup."}
        </p>

        <div className="flex flex-wrap items-center gap-3 font-bold">
          <span
            className="flex h-[41px] items-center justify-center px-5 text-sm text-white transition hover:-translate-y-0.5 hover:shadow-md"
            style={{ backgroundColor: activeTheme.primaryColor, borderRadius: buttonRadius }}
          >
            Featured
          </span>
          <span
            className="flex h-[41px] items-center justify-center px-5 text-sm text-white transition hover:-translate-y-0.5 hover:shadow-md"
            style={{ backgroundColor: activeTheme.accentColor, borderRadius: buttonRadius }}
          >
            New
          </span>
          <span
            className="flex h-[41px] items-center justify-center border px-5 text-sm transition hover:-translate-y-0.5 hover:shadow-md"
            style={{ borderColor: activeTheme.secondaryColor, borderRadius: buttonRadius, color: activeTheme.secondaryColor }}
          >
            Popular
          </span>
        </div>
      </div>
    </div>
  );
}
