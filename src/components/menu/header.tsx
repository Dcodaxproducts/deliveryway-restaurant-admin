"use client";

import Header from "../header";
import { Button } from "@/components/ui/button";
import {
  Trash2,
  Download,
  Plus,
  HelpCircle,
  PlusCircle,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import ImportModal from "../common/ImportModal";
import CreateMenuModal from "./CreateMenuModal";
import CreateCategoryModalParent from "./listing/CreateCategoryModalParent";
import CreateMenuItemModal from "./CreateMenuItemModal/CreateMenuItemModal";
import { useAuth } from "@/hooks/useAuth";

interface HeaderProps {
  title: string;
  description?: string;
}

export default function BranchesHeader({ title, description }: HeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isBranchAdmin } = useAuth();

   const [open, setOpen] = useState(false); 
  const [createMenu, setCreateMenu] = useState(false);
  const [createMenuItem, setCreateMenuItem] = useState(false);
  const [createCategory, setCreateCategory] = useState(false);

  useEffect(() => {
  if (searchParams.get("create") === "true") {
    setCreateMenu(true);
  }
}, [searchParams]);


  return (
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between w-full">
      
      {/* Left: Title */}
      <Header title={title} description={description} />

      {/* Right: Actions */}
      <div className="flex flex-wrap gap-3 sm:gap-4 justify-start">
        
        {/* <Button
          variant="outline"
         className="h-[38px] sm:h-[44px] rounded-[12px] px-3 sm:px-4 flex items-center gap-2 text-[#767676] border-[#E6E7EC] text-[13px] sm:text-[15px] font-[500]"
           onClick={()=>router.push("/menu/modifier-groups")}
        >
          <PlusCircle size={18} className="text-[#767676]" />
  Modifier Groups
        </Button> */}

           {!isBranchAdmin ? (
           <Button
          variant="outline"
         className="h-[38px] sm:h-[44px] rounded-[12px] px-3 sm:px-4 flex items-center gap-2 text-[#767676] border-[#E6E7EC] text-[13px] sm:text-[15px] font-[500]"
           onClick={()=>router.push("/menu/modifier")}
        >
          <PlusCircle size={18} className="text-[#767676]" />
  Modifiers
        </Button>
        ) : null}

        {/* Import */}
        {/* <Button
          variant="outline"
         className="h-[38px] sm:h-[44px] rounded-[12px] px-3 sm:px-4 flex items-center gap-2 text-[#767676] border-[#E6E7EC] text-[13px] sm:text-[15px] font-[500]"
              onClick={() => setOpen(true)}
        >
          <Download size={18} className="text-[#767676]" />
          Import
          <HelpCircle size={16} className="text-[#767676] ml-1" />
        </Button> */}
 <Button
  variant="outline"
        className="h-[38px] sm:h-[44px] rounded-[12px] px-3 sm:px-4 flex items-center gap-2 text-[#767676] border-[#E6E7EC] text-[13px] sm:text-[15px] font-[500]"
              onClick={() => router.push('/menu/categories')}
        >
          <PlusCircle size={18} className="text-[#767676]"  />
          Categories
        </Button>
     
     
         <Button
  variant="outline"
        className="h-[38px] sm:h-[44px] rounded-[12px] px-3 sm:px-4 flex items-center gap-2 text-[#767676] border-[#E6E7EC] text-[13px] sm:text-[15px] font-[500]"
               onClick={() => router.push('/menu/items')}
        >
          <PlusCircle size={18} className="text-[#767676]"  />
          Items
        </Button>


        {!isBranchAdmin ? (
        <Button
       className="h-[38px] sm:h-[44px] rounded-[12px] px-4 sm:px-5 flex items-center gap-2 bg-primary hover:bg-red-700 text-white text-[13px] sm:text-[15px] font-[500]"
            onClick={() => setCreateMenu(true)}
        >
          <PlusCircle size={18} color="#fff"  />
          Add Menu
        </Button>
        ) : null}

      </div>

      <ImportModal open={open} onOpenChange={setOpen}  title="Import Menu List"
  subtitle="Upload menu items for this restaurant" />
      <CreateMenuModal open={createMenu} onOpenChange={setCreateMenu} />
      <CreateMenuItemModal open={createMenuItem} onOpenChange={setCreateMenuItem} />
              <CreateCategoryModalParent open={createCategory} onOpenChange={setCreateCategory} />

    </div>
  );
}
