"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function SearchBar() {
  const [searchValue, setSearchValue] = useState("")

  return (
    <div className="hidden md:block flex-1 max-w-7xl ml-3 ">
      <div className="relative flex items-center bg-white border border-gray-300 rounded-lg px-3 h-[56px] focus-within:ring-2 focus-within:ring-ring transition-all">
        <Input
          type="text"
          placeholder="Search here"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="flex-1 border-none shadow-none focus-visible:ring-0 h-full px-0 text-base"
        />
        <Search className="w-[24px] h-[24px] text-gray-400 stroke-1" />
      </div>
    </div>
  )
}
