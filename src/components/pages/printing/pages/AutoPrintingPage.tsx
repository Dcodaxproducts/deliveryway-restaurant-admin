import AutoPrintingSettings from "@/components/pages/Printing/components/autoPrinting/AutoPrintingSettings";
import Container from "@/components/common/Container";
import Header from "@/components/common/PageHeader";
import PosPrinterAccounts from "@/components/pages/Printing/components/posPrinter/PosPrinterAccounts";

const CustomerSettingsPage = () => {
    return (
        <Container>
            <Header
                title="Auto-Printing & POS Integration"
                description="Automatically print orders and connect your POS system."
            />
          
           <AutoPrintingSettings />
           <PosPrinterAccounts />
        </Container>
    );
};

export default CustomerSettingsPage;
