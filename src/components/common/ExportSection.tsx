import { FileText } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ExportSection() {
  return (
    <div className="space-y-[15px]">
      <h3 className="text-base text-dark">Export Reports</h3>

      <div className="scroll-hidden flex max-w-[700px] gap-[16px] overflow-x-auto">
        <Button
          variant="outline"
          className="flex h-[52px] min-w-[180px] flex-1 items-center justify-center gap-3 rounded-[12px] border-gray-200 font-medium text-gray transition-colors hover:bg-gray-50"
        >
          <FileText size={20} className="text-gray-400" />
          CSV
        </Button>

        <Button
          variant="outline"
          className="flex h-[52px] min-w-[180px] flex-1 items-center justify-center gap-3 rounded-[12px] border-gray-200 font-medium text-gray transition-colors hover:bg-gray-50"
        >
          <FileText size={20} className="text-gray-400" />
          Excel
        </Button>

        <Button
          variant="outline"
          className="flex h-[52px] min-w-[180px] flex-1 items-center justify-center gap-3 rounded-[12px] border-gray-200 font-medium text-gray transition-colors hover:bg-gray-50"
        >
          <FileText size={20} className="text-gray-400" />
          PDF
        </Button>
      </div>
    </div>
  );
}
