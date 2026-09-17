"use client";

import { Button } from "@/components/ui/button";
import Header from "@/components/common/PageHeader";
import { useState } from "react";
import MakeReservationModal from "@/components/common/modals/MakeReservationModal";
import { useTranslations } from "next-intl";

interface HeaderProps {
  title: string;
  description?: string;
}

export default function PosHeader({ title, description }: HeaderProps) {
  const t = useTranslations("pos");
  const [openMakeReservation, setOpenMakeReservation] = useState(false);


  return (
    <>
      <Header
        title={title}
        description={description}
        actions={
        <Button
          onClick={() => setOpenMakeReservation(true)}
        >
          {t("makeReservation")}
        </Button>
        }
      />
      <MakeReservationModal
        open={openMakeReservation}
        onOpenChange={setOpenMakeReservation}
      />
    </>
  );
}
