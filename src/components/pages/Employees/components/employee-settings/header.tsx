"use client";

import { Button } from "@/components/ui/button";
import Header from "@/components/common/PageHeader";
import { useState } from "react";
import EditCustomerModal from "./AddEmployeeModal";
import { AddRoleModal } from "./AddRoleModal";
import { useTranslations } from "next-intl";

type HeaderProps = {
  title: string;
  description: string;
  onEmployeeSuccess?: () => void;
  onRoleSuccess?: () => void;
};

export default function EmployeeSettingsHeader({
  title,
  description,
  onEmployeeSuccess,
  onRoleSuccess,
}: HeaderProps) {
  const t = useTranslations("employees");
  const [open, setOpen] = useState(false);
  const [openRoleModal, setOpenRoleModal] = useState(false);

  return (
    <>
      <Header
        title={title}
        description={description}
        actions={
          <>
            <Button variant="outline" onClick={() => setOpenRoleModal(true)}>
              {t("addRole")}
            </Button>

            <Button onClick={() => setOpen(true)}>{t("addNew")}</Button>
          </>
        }
      />

      <EditCustomerModal
        open={open}
        onOpenChange={setOpen}
        onSuccess={onEmployeeSuccess}
      />
      <AddRoleModal
        open={openRoleModal}
        onOpenChange={setOpenRoleModal}
        onSuccess={onRoleSuccess}
      />
    </>
  );
}
