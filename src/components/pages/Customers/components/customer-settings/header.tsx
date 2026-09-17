"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import Header from "@/components/common/PageHeader"
import AddCustomerModal from "./AddCustomerModal"
import { useTranslations } from "next-intl"

interface HeaderProps {
  title: string
  description: string
  onRefresh: () => void
}

export default function EmployeeSettingsHeader({
  title,
  description,
  onRefresh,
}: HeaderProps) {
  const [open, setOpen] = useState(false)
  const t = useTranslations("customers")

  return (
    <>
      <div className="flex flex-col gap-4 md:gap-6 lg:flex-row lg:items-center lg:justify-between w-full">
        <Header title={title} description={description} />

        <div className="flex flex-wrap gap-3 sm:gap-4 justify-start">
          <Button
            onClick={() => setOpen(true)}
            className="h-[38px] rounded-[12px] px-4 text-[13px] font-[500] sm:h-[44px] sm:px-5 sm:text-[15px]"
          >
            {t("addNewCustomer")}
          </Button>
        </div>
      </div>

      {/*  MODAL */}
      <AddCustomerModal open={open} onOpenChange={setOpen} onSuccess={onRefresh} />
    </>
  )
}
