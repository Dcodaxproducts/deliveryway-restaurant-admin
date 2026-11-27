import { LocalizedText } from "@/components/common/LocalizedText";
import { getLocalizedMessage } from "@/lib/localized-message";
import Link from "next/link";

import Container from "@/components/common/Container";
import Header from "@/components/pages/Branches/components/header";
import { Button } from "@/components/ui/button";

export default function InvoicingPage() {
  return (
    <Container>
      <Header
        title={getLocalizedMessage("message155")}
        description="Invoice downloads and customer email sends are now managed from each order row."
      />

      <div className="rounded-[14px] bg-white p-6 shadow-sm lg:p-[30px]">
        <div className="max-w-2xl space-y-4">
          <h2 className="text-xl font-semibold text-dark">
            <LocalizedText messageKey="message394" />
          </h2>
          <p className="text-sm leading-6 text-gray">
            <LocalizedText messageKey="message068" />
          </p>
          <Button asChild className="h-[44px] rounded-[12px] px-5">
            <Link href="/orders?tab=today"><LocalizedText messageKey="message140" /></Link>
          </Button>
        </div>
      </div>
    </Container>
  );
}
