import Container from "@/components/common/Container";
import Header from "@/components/common/PageHeader";
import SettingsForm from "@/components/pages/Settings/forms/SettingsForm";

const PaymentSettingsPage = () => {
  return (
    <Container>
      <Header
        title="Payment Settings"
        description="Review wallet payouts and request manual payout transfers"
      />
      <SettingsForm variant="payments" />
    </Container>
  );
};

export default PaymentSettingsPage;
