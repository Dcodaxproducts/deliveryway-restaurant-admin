import Container from "@/components/common/Container";
import Header from "@/components/pages/Settings/restaurants/components/restaurants/header";
import Filters from "@/components/common/FilterPanel";
import RestaurantTable from "@/components/pages/Settings/restaurants/components/restaurants/table";
import Pagination from "@/components/common/PaginationSection";
import { SectionCard } from "@/components/common/SectionCard";

export default function RestaurantsPage() {
    return (
        <Container>
            <Header
                title="Restaurants List"
                description="View and manage all Restaurants from here"
            />

            <SectionCard padding="md" className="space-y-6">
                <Filters
                    type="restaurant"
                />

                <RestaurantTable />
            </SectionCard>

            <Pagination />
        </Container>
    );
}
