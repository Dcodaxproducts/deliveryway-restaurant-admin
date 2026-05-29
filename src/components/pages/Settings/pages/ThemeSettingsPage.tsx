import Container from "@/components/common/Container";
import Header from "@/components/common/PageHeader";
import RestaurantPicker from "@/components/common/RestaurantPicker";
import BrandAssetsSection from "@/components/pages/Settings/theme/components/theme-settings/brand-assets-section";
import ColorSchemeSection from "@/components/pages/Settings/theme/components/theme-settings/color-scheme-section";
import PreviewSection from "@/components/pages/Settings/theme/components/theme-settings/preview-section";
import TypographySection from "@/components/pages/Settings/theme/components/theme-settings/typography-section";

const ThemeSettingsPage = () => {
    return (
        <Container>
            <Header
                title="Theme Settings"
                description="Welcome back! Here's what's happening with your platform today."
            />
            <RestaurantPicker />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <BrandAssetsSection />
                </div>
                <div>
                    <ColorSchemeSection />
                </div>
            </div>
            <TypographySection />
            <PreviewSection />
        </Container>
    );
};

export default ThemeSettingsPage;
