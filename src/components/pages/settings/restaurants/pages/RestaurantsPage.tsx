import Container from "@/components/container";
import Header from "@/components/restaurants/header";
import Filters from "@/components/filter";
import RestaurantTable from "@/components/restaurants/table";
import Pagination from "@/components/pagination";

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