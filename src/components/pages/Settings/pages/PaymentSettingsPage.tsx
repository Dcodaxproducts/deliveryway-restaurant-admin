import { getLocalizedMessage } from "@/lib/localized-message";
import Container from "@/components/common/Container";
import Header from "@/components/common/PageHeader";
import SettingsForm from "@/components/pages/Settings/forms/SettingsForm";

const PaymentSettingsPage = () => {
  return (
    <Container>
      <Header
        title={getLocalizedMessage("message274")}
        description="Review wallet payouts and request manual payout transfers"
      />
      <SettingsForm variant="payments" />
    </Container>
  );
};

export default PaymentSettingsPage;
