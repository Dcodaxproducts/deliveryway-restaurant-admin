import { getLocalizedMessage } from "@/lib/localized-message";
import Container from "@/components/common/Container";
import Header from "@/components/common/PageHeader";

const AddRestaurant = () => {
  return (
    <Container>
      <Header
        title={getLocalizedMessage("message022")}
        description="Restaurant creation is handled outside the branch-admin dashboard."
      />
    </Container>
  );
};

export default AddRestaurant;
