"use client";

import Link from "next/link";
import Container from "@/components/common/Container";
import { StatePanel } from "@/components/common/EmptyState";
import Header from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/common/SectionCard";

const CustomerTrashPage = () => {
    const t = useTranslations("menu.trash");
    const feedbackT = useTranslations("common.feedback");
    return (
        <Container>
            <Header title={t("title")} />
            <SectionCard padding="md">
                <StatePanel
                    state="unavailable"
                    title={feedbackT("unavailable", { subject: t("title") })}
                    description={feedbackT("trashUnavailableDescription")}
                    action={<Button asChild variant="outline"><Link href="/menu">{feedbackT("backTo", { subject: feedbackT("subjects.menus") })}</Link></Button>}
                />
            </SectionCard>
        </Container>
    );
};

export default CustomerTrashPage;
