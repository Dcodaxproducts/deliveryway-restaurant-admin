"use client"

import { HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Header from '@/components/common/PageHeader'
import { useRouter } from 'next/navigation'
import type { HeaderProps } from '@/types/page-header'

export default function DeliveryManHeader({ title, description }: HeaderProps) {
    const router = useRouter()
 
    return (
        <>
        <div className="flex flex-col gap-4 md:gap-6 lg:flex-row lg:items-center lg:justify-between w-full">
            <Header
                title={title}
                description={description}
            />

            {/* 2. Buttons stack on tiny mobile, become row on sm (640px) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:gap-4">
                <Button
                    variant="outline"
                className="h-[44px] rounded-[12px] px-4 flex items-center gap-2 border-[#E6E7EC] text-[15px] font-[500] text-[#767676]"
              onClick={()=>router.push("/deliveryman/trash")}
                >
                    <p>View Trash</p>
                    <HelpCircle size={18} className="text-[#767676]" />
                </Button>

                <Button
                    variant="default"
                    onClick={() => router.push("/deliveryman/add")}
                 className="h-[44px] rounded-[12px] px-5 flex items-center gap-2 bg-primary hover:bg-red-700 text-white text-[15px] font-[500]"
         >
                    Add New Delivery Man
                </Button>
            </div>
        </div>

        
      </>
    )
}