"use client";

import { useState } from "react";
import BranchCard from "@/components/cards/BranchCard";
import EmptyState from "@/components/common/EmptyState";
import BranchDetailsModal from "./BranchDetails/BranchDetailsModal";

interface Props {
  branches?: any[];
  loading?: boolean;
}

export default function BranchesList({ branches = [], loading }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
 const [selectedBranch, setSelectedBranch] = useState<any | null>(null);

const openDialog = (branchId: string) => {
  const branch = branches.find(({ id }) => id === branchId);
  setSelectedBranch(branch ?? null);
  setIsModalOpen(true);
};

  const closeDialog = () => setIsModalOpen(false);

    if (loading) {
    return (
      <div className="flex items-center justify-between bg-white rounded-[14px] border border-gray-200 px-4 py-4 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="size-4 bg-gray-200 rounded" />
          <div className="size-10 bg-gray-200 rounded-lg" />
          <div className="space-y-2">
            <div className="h-3 w-[120px] bg-gray-200 rounded" />
            <div className="h-2 w-[80px] bg-gray-200 rounded" />
          </div>
        </div>

        <div className="flex gap-2">
          <div className="h-8 w-8 bg-gray-200 rounded" />
          <div className="h-8 w-8 bg-gray-200 rounded" />
          <div className="h-8 w-8 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }


  if (!branches || branches.length === 0  && !loading) {
    return (
      <EmptyState
        title="Looks like there are no branches yet!"
        description="You haven’t added any branches yet. Start by creating a new one."
      />
    );
  }

  return (
    <div className="space-y-3 min-h-[40vh]">
      {branches.map(({ id, name, isActive, availability, isMain, coverImage, logoUrl }) => (
      <BranchCard
  key={id}
  id={id}
  name={name}
  isActive={isActive}
  availability={availability}
  loading={loading}
  isDefault={isMain}
  itemsCount={0}
  openDialog={openDialog}
  coverImage={coverImage}
  logoUrl={logoUrl}
/>
      ))}

     <BranchDetailsModal
  isOpen={isModalOpen}
  closeDialog={closeDialog}
  branch={selectedBranch}
/>
    </div>
  );
}
