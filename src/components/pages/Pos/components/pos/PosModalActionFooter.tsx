"use client";

import { Button } from "@/components/ui/button";

interface ModalActionFooterProps {
  leftLabel: string;
  rightLabel: string;
  onLeftClick?: () => void;
  onRightClick?: () => void;
}

export default function ModalActionFooter({
  leftLabel,
  rightLabel,
  onLeftClick,
  onRightClick,
}: ModalActionFooterProps) {
  return (
    <div className="mt-8 flex items-center justify-center gap-8">
      <button
        onClick={onLeftClick}
        className="text-[17.5px] font-semibold text-[#101828] hover:underline"
      >
        {leftLabel}
      </button>

      <Button
        onClick={onRightClick}
        className="px-10 h-[44px] rounded-[14px] bg-primary text-white text-[16px] font-medium hover:bg-primary/90"
      >
        {rightLabel}
      </Button>
    </div>
  );
}
