"use client"

import { Button } from "@/components/ui/button"
import Header from "../../header"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

interface HeaderProps {
  title: string
  description: string
  onConfirm: () => void
  loading?: boolean
}

export default function AddDeliveryManHeader({
  title,
  description,
  onConfirm,
  loading,
}: HeaderProps) {
  const router = useRouter()

  return (
    <div className="flex flex-col gap-4 md:gap-6 lg:flex-row lg:items-center lg:justify-between w-full">
      <Header title={title} description={description} />

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:gap-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="w-full sm:w-auto flex items-center gap-2 justify-between sm:justify-start
          bg-transparent border-none shadow-none
          text-black hover:bg-transparent hover:text-black text-sm mr-2 text-[15px]"
        >
          Cancel
        </Button>

        <Button
          onClick={onConfirm}
          disabled={loading}
          className="w-full sm:w-auto whitespace-nowrap text-[15px] bg-primary"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="animate-spin" size={16} />
              Saving...
            </span>
          ) : (
            "Confirm"
          )}
        </Button>
      </div>
    </div>
  )
}