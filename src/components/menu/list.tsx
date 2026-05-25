"use client";

import { useState } from "react";
import BranchCard from "../cards/BranchCard";
import EmptyState from "../common/EmptyState";
import { useRouter } from "next/navigation";
import CreateMenuModal from "./CreateMenuModal";

interface Menu {
  id: string;
  name: string;
 
  isDefault?: boolean;
  _count?: {
    items: number;
  };
}

interface Props {
  menus?: Menu[];
  loading?: boolean;
}

export default function MenuList({ menus = [], loading }: Props) {
  const router = useRouter();
const [editingMenuId, setEditingMenuId] = useState<string | null>(null);
const [openModal, setOpenModal] = useState(false);
if (loading) {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="h-[70px] rounded-xl bg-gray-100 border border-gray-200"
        />
      ))}
    </div>
  );
} 
if (!menus || menus.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-3 min-h-[40vh]">
      {menus.map((menu) => (
        <BranchCard
          key={menu.id}
          id={menu.id}
          name={menu.name}
          itemsCount={menu._count?.items || 0}
          isDefault={menu.isDefault}
          openMenuDetails={() => router.push(`/menu/listing?id=${menu.id}`)}
          editMenu={(id) => {
    setEditingMenuId(id);
    setOpenModal(true);
  }}
        />
      ))}

      <CreateMenuModal
  open={openModal}
  onOpenChange={setOpenModal}
  menuId={editingMenuId || undefined}
/>
    </div>
  );
}