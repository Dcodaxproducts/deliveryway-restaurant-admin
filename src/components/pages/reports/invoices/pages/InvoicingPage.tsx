import Link from "next/link";

import Container from "@/components/common/Container";
import Header from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/common/SectionCard";

export default function InvoicingPage() {
  return (
    <Container>
      <Header
        title="Invoicing"
        description="Invoice downloads and customer email sends are now managed from each order row."
      />

      <SectionCard
        padding="lg"
        title="Use Orders for invoice actions"
        description="Choose an order row menu to download the invoice PDF or send it to the customer email on file. Subscription and payout billing documents remain available under Reports."
      >
        <Button asChild>
          <Link href="/orders?tab=today">Go to Today's Orders</Link>
        </Button>
      </SectionCard>
    </Container>
  );
}
