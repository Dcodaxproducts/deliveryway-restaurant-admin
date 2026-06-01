import Container from "@/components/common/Container";
import Header from "@/components/pages/Settings/restaurants/components/restaurants/header";
import Filters from "@/components/common/FilterPanel";
import RestaurantTable from "@/components/pages/Settings/restaurants/components/restaurants/table";
import Pagination from "@/components/common/PaginationSection";

export default function RestaurantsPage() {
    return (
        <Container>
            <Header
                title="Restaurants List"
                description="View and manage all Restaurants from here"
            />

            <div className="space-y-[32px] bg-white lg:p-[30px] lg:rounded-[14px] lg:shadow-sm">
                <Filters
                    type="restaurant"
                />

                <RestaurantTable />
            </div>

            <Pagination />
        </Container>
    );
}