import Container from "@/components/common/Container";
import Header from "@/components/common/PageHeader";
import SettingsForm from "@/components/pages/Settings/forms/SettingsForm";
import { SettingsLayout } from "@/components/common/SettingsLayout";

const PaymentSettingsPage = () => {
  return (
    <Container>
      <Header
        title="Payment Settings"
        description="Review wallet payouts and request manual payout transfers"
      />
      <SettingsLayout>
        <SettingsForm variant="payments" />
      </SettingsLayout>
    </Container>
  );
};

export default PaymentSettingsPage;
