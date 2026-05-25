import AutoPrintingSettings from "@/components/autoPrinting/AutoPrintingSettings";
import Container from "@/components/container";
import Header from "@/components/header";

const CustomerSettingsPage = () => {
    return (
        <Container>
            <Header
                title="Auto-Printing & POS Integration"
                description="Automatically print orders and connect your POS system."
            />
          
           <AutoPrintingSettings />
        </Container>
    );
};

export default CustomerSettingsPage;
