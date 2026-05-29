"use client";
import { Button } from "@/components/ui/button";

interface PageWrapperProps {
  title: string;
  children: React.ReactNode;
  onReset?: () => void;
  onSave?: () => void;
  saving?: boolean;
}

export default function PageWrapper({
  title,
  children,
  onReset,
  onSave,
  saving = false,
}: PageWrapperProps) {
  return (
    <div className="w-full rounded-[14px] p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">{title}</h1>

        <div className="flex items-center gap-4">
          <button
            onClick={onReset}
            className="text-sm text-gray-500 hover:underline m-0"
          >
            Reset
          </button>

          <Button
            onClick={onSave}
            disabled={saving}
            className="bg-primary hover:bg-red-800 h-10 px-8 rounded-[12px] m-0"
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {children}
    </div>
  );
}