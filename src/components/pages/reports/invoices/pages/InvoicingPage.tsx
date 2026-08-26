import Link from "next/link";

import Container from "@/components/common/Container";
import Header from "@/components/pages/Branches/components/header";
import { Button } from "@/components/ui/button";

export default function InvoicingPage() {
  return (
    <Container>
      <Header
        title="Invoicing"
        description="Invoice downloads and customer email sends are now managed from each order row."
      />

      <div className="rounded-[14px] bg-white p-6 shadow-sm lg:p-[30px]">
        <div className="max-w-2xl space-y-4">
          <h2 className="text-xl font-semibold text-dark">
            Use Orders for invoice actions
          </h2>
          <p className="text-sm leading-6 text-gray">
            Choose an order row menu to download the invoice PDF or send it to
            the customer email on file. Subscription and payout billing
            documents remain available under Reports.
          </p>
          <Button asChild className="h-[44px] rounded-[12px] px-5">
            <Link href="/orders?tab=today">Go to Today's Orders</Link>
          </Button>
        </div>
      </div>
    </Container>
  );
}
