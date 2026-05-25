"use client";

import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

type EmptySetupCardProps = {
  title: string;
  description?: string;
  emptyMessage: string;
  actionLabel: string;
  onAction?: () => void;
  icon?: React.ReactNode;
};

export default function EmptySetupCard({
  title,
  description,
  emptyMessage,
  actionLabel,
  onAction,
  icon,
}: EmptySetupCardProps) {
  return (
    <div className="space-y-4 mb-9">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
          <Info size={16} className="text-gray-500" />
          <span>{title}</span>
        </div>

        {description && (
          <p className="text-sm text-gray-500 mt-1">
            {description}
          </p>
        )}
      </div>

      {/* Card */}
      <div className="border rounded-[14px] min-h-[260px] flex items-center justify-center p-8 border-[#bbbbbb]">
        <div className="text-center space-y-4 max-w-[360px]">
          {/* Icon */}
          {icon && (
            <div className="flex justify-center">
              {icon}
            </div>
          )}

          {/* Message */}
          <p className="text-sm text-gray-600">
            {emptyMessage}
          </p>

          {/* Action */}
          <Button
            variant="ghost"
            className="text-primary font-medium hover:bg-transparent text-md"
            onClick={onAction}
          >
            {actionLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
