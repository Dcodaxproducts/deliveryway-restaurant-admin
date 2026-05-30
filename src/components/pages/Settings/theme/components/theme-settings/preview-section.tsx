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

export default function PreviewSection({ values }: PreviewSectionProps) {
  const { restaurant } = values;
  const { branding } = restaurant;
  const { theme } = branding;
  const logoUrl = restaurant.logoUrl || branding.logo.light || branding.assets.logoUrl;
  const buttonRadius = getButtonRadius(theme.buttonStyle, theme.borderRadius);

  return (
    <div className="rounded-lg bg-white p-4 shadow-sm md:p-6">
      <h3 className="mb-[24px] text-base text-dark">Preview</h3>
      <div
        className="space-y-5 rounded-[18px] border border-gray-200 p-5"
        style={{
          backgroundColor: theme.backgroundColor,
          color: theme.textColor,
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
              <span style={{ color: theme.secondaryColor }}>{getInitials(restaurant.name)}</span>
            )}
          </div>
          <div>
            <h1
              className="text-2xl font-bold md:text-[37px]"
              style={{ color: theme.primaryColor, fontFamily: theme.headingFontFamily }}
            >
              {restaurant.name || "Restaurant Name"}
            </h1>
            <p className="text-sm" style={{ color: theme.secondaryColor }}>
              {restaurant.tagline || "Fresh orders, fast delivery, memorable hospitality."}
            </p>
          </div>
        </div>

        <p className="max-w-3xl text-base leading-7">
          {restaurant.bio || "Experience the finest dining with a carefully curated menu. Order online for delivery or pickup."}
        </p>

        <div className="flex flex-wrap items-center gap-3 font-bold">
          <span
            className="flex h-[41px] items-center justify-center px-5 text-sm text-white"
            style={{ backgroundColor: theme.primaryColor, borderRadius: buttonRadius }}
          >
            Featured
          </span>
          <span
            className="flex h-[41px] items-center justify-center px-5 text-sm text-white"
            style={{ backgroundColor: theme.accentColor, borderRadius: buttonRadius }}
          >
            New
          </span>
          <span
            className="flex h-[41px] items-center justify-center border px-5 text-sm"
            style={{ borderColor: theme.secondaryColor, borderRadius: buttonRadius, color: theme.secondaryColor }}
          >
            Popular
          </span>
        </div>
      </div>
    </div>
  );
}
