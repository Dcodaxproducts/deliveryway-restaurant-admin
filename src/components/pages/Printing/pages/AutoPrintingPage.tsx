import AutoPrintingSettings from "@/components/pages/Printing/components/autoPrinting/AutoPrintingSettings";
import Container from "@/components/common/Container";
import Header from "@/components/common/PageHeader";

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
