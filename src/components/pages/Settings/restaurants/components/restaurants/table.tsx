"use client";

import { StatePanel } from "@/components/common/EmptyState";
import { useTranslations } from "next-intl";

export default function RestaurantTable() {
    const feedbackT = useTranslations("common.feedback");
    return (
        <StatePanel
            state="unavailable"
            title={feedbackT("unavailable", { subject: feedbackT("restaurantList") })}
            description={feedbackT("restaurantUnavailableDescription")}
        />
    );
}
