"use client";

import Container from "@/components/common/Container";
import Table from "@/components/pages/Employees/components/employee-settings/table";
import Header from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

const EmployeeTrashPage = () => {
  const t = useTranslations("employees");

  return (
    <Container>
      <Header title={t("trashTitle")} description={t("trashDescription")} />
      <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm space-y-6">
        <Table />
        <div className="flex items-center gap-6 pt-4 border-t border-[#EDEFF2]">
          {/* Cancel */}
          <Button
            variant="ghost"
            className="text-sm text-gray-500 hover:text-gray-700 w-auto h-auto"
          >
            {t("actions.cancel")}
          </Button>

          {/* Confirm */}
          <Button
            variant="default"
            className="h-[40px] px-6 rounded-[10px] font-100"
          >
            {t("actions.confirm")}
          </Button>
        </div>
      </div>
    </Container>
  );
};

export default EmployeeTrashPage;
