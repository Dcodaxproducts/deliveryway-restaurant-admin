"use client"

import { Button } from '@/components/ui/button'
import Header from '../header'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import EditCustomerModal from './AddEmployeeModal'

type HeaderProps = {
  title: string;
  description: string;
  onEmployeeSuccess?: () => void;
  onRoleSuccess?: () => void;
};

import { AddRoleModal } from './AddRoleModal'
export default function EmployeeSettingsHeader({
  title,
  description,
  onEmployeeSuccess,
  onRoleSuccess,
}: HeaderProps) {
    const router = useRouter()
   const [open, setOpen] = useState(false);
   const [openRoleModal, setOpenRoleModal] = useState(false);

    return (
        <>
        <div className="flex flex-col gap-4 md:gap-6 lg:flex-row lg:items-center lg:justify-between w-full">
            <Header
                title={title}
                description={description}
            />

            {/* 2. Buttons stack on tiny mobile, become row on sm (640px) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:gap-4">
                {/* <Button
                    variant="outline"
              className="h-[44px] rounded-[12px] px-4 flex items-center gap-2 border-[#E6E7EC] text-[15px] font-[500] text-[#767676]"
                onClick={()=>router.push("/employees-settings/trash")}
                >
                    <p>View Trash</p>
                    <HelpCircle size={18} className="text-[#767676]" />
                </Button> */}

                  <Button
                    variant="outline"
              className="h-[44px] rounded-[12px] px-4 flex items-center gap-2 border-[#E6E7EC] text-[15px] font-[500] text-[#767676]"
           onClick={()=>  setOpenRoleModal(true)}
                >
                    <p>Add Role</p>
                    {/* <HelpCircle size={18} className="text-[#767676]" /> */}
                </Button>


                <Button
                    onClick={() => setOpen(true)}
              className="h-[44px] rounded-[12px] px-5 flex items-center gap-2 bg-primary hover:bg-red-700 text-white text-[15px] font-[500]"
            >
                    Add New Employee
                </Button>
            </div>
        </div>

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
    )
}