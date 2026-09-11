"use client";

import Container from "@/components/common/Container";
import Header from "@/components/common/PageHeader";
import RestaurantTable from "@/components/pages/Settings/restaurants/components/restaurants/table";
import { SectionCard } from "@/components/common/SectionCard";
import { useTranslations } from "next-intl";

export default function RestaurantsPage() {
    const feedbackT = useTranslations("common.feedback");
    return (
        <Container>
            <Header
                title={feedbackT("restaurantList")}
            />

            <SectionCard padding="md">
                <RestaurantTable />
            </SectionCard>
        </Container>
    );
}
