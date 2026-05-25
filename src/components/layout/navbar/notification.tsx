import { VscBell } from "react-icons/vsc"
import { barlow } from "@/lib/fonts"
import { cn } from "@/lib/utils"
import Link from "next/link"

const NOTIFICATION_DATA = {
  count: 4,
}

export default function NotificationBell() {
  return (
    <Link
      href="/notifications"
      className={cn(
        "relative flex items-center justify-center bg-[#2D9CDB26] hover:bg-[#2D9CDB40] transition-colors duration-200 rounded-xl shrink-0",
        "mx-2 w-[38px] h-[40px] p-0",
        "lg:mx-[39px] lg:w-[45.78px] lg:h-[48px]"
      )}
    >
      <VscBell
        className="w-[18px] h-[18px] lg:w-[22px] lg:h-[22px] text-[#2D9CDB]"
        strokeWidth={0.4}
      />
      
      {/* {NOTIFICATION_DATA.count > 0 && (
        <span 
          className={cn(
            barlow.className, 
            "absolute flex items-center justify-center bg-[#2D9CDB] border-[3px] border-[#F3F2F7] text-white rounded-full",
            "bottom-[27px] -right-1 w-5 h-5 text-[10px]",
            "lg:bottom-[30px] lg:-right-2 lg:w-6 lg:h-6 lg:text-xs"
          )}
        >
          {NOTIFICATION_DATA.count}
        </span>
      )} */}
    </Link>
  )
}