import Container from "@/components/container";
import Filters from "@/components/filter";
import Pagination from "@/components/pagination";
import Header from "@/components/branches/header";
import { Button } from "@/components/ui/button";
import Table from "@/components/branches/list";

export default function InvoicingPage() {
    return (
        <Container>
            <Header
                title="Invoicing Dashboard"
                description="Manage monthly invoices, commissions, and payouts in one place."
            />

            <div className="space-y-[32px] bg-white lg:p-[30px] rounded-[14px] shadow-sm">
                <Filters />

                <div className="space-x-8 px-4 lg:pl-6">
                    <Button
                        variant="default"
                        className="rounded-[14px] w-full lg:w-auto"
                    >
                        Active Invoices
                    </Button>

                    <Button
                        variant="ghost"
                        className="font-semibold text-base text-gray w-full lg:w-auto"
                    >
                        Archive Invoices
                    </Button>
                </div>

                
                <div className="px-2 lg:px-0">
                    <Table />
                </div>
            </div>

            <Pagination />
        </Container>
    );
}