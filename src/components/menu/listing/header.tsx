"use client";

import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface HeaderProps {
  title: string;
  description?: string;
  editing: boolean;
  onManageClick: () => void;
}


export default function BranchesHeader({ title, description, editing, onManageClick }: HeaderProps) {
  const router = useRouter();
  
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between w-full">
      
      {/* Left: Title */}
      <Header title={title} description={description} />

      
       <Button
  onClick={onManageClick}
  className="h-[44px] rounded-[12px] px-11 bg-primary hover:bg-red-800 text-white"
>
  {editing ? "Back" : "Manage"}
</Button>



  

    </div>
  );
}
