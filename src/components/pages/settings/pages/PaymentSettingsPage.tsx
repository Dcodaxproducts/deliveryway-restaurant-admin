import Container from "@/components/common/Container";
import Header from "@/components/common/PageHeader";
import SettingsForm from "@/components/pages/Settings/forms/SettingsForm";

const PaymentSettingsPage = () => {
  return (
    <Container>
      <Header
        title="Payment Settings"
        description="Manage restaurant checkout methods, wallet availability, and Stripe account setup"
      />
      <SettingsForm variant="payments" />
    </Container>
  );
};

export default PaymentSettingsPage;
