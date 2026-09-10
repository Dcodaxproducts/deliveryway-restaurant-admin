"use client";

 import Container from "@/components/common/Container";
import Table from "@/components/pages/Menu/legacy/root-menu-components/list";

import Header from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/common/SectionCard";

const CustomerTrashPage = () => {
    const t = useTranslations("menu.trash");
    const commonT = useTranslations("common");

    return (
        <Container>
            <Header
                title={t("title")}
                description={t("description")}
            />
            <SectionCard padding="md" className="space-y-6">
                <Table />
               <div className="flex items-center gap-6 pt-4 border-t border-[#EDEFF2]">
  {/* Cancel */}
  <Button
    variant="ghost"
    className="text-sm text-gray-500 hover:text-gray-700 w-auto h-auto"
  >
    {commonT("cancel")}
  </Button>

  {/* Confirm */}
  <Button
    variant="default"
    className="h-[40px] px-6 rounded-[10px] font-100"
  >
    {commonT("confirm")}
  </Button>
</div>


            </SectionCard>

           
        </Container>
    );
};

export default CustomerTrashPage;
