"use client";


import { LocalizedText } from "@/components/common/LocalizedText";
import { getLocalizedMessage } from "@/lib/localized-message";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Filter() {
  return (
    <div className="bg-white p-4 lg:p-[30px] rounded-[14px] shadow-sm border border-gray-100">
      <div className="flex flex-col lg:flex-row items-end gap-[24px] w-full">
        
        {/* Date Range Selector */}
        <div className="flex-1 w-full space-y-[12px]">
          <Label><LocalizedText messageKey="message092" /></Label>
          <Select>
            <SelectTrigger className="h-[52px] border-gray-200 rounded-[12px] focus:ring-primary w-full">
              <SelectValue placeholder={getLocalizedMessage("message344")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-7"><LocalizedText messageKey="message165" /></SelectItem>
              <SelectItem value="last-30"><LocalizedText messageKey="message164" /></SelectItem>
              <SelectItem value="this-month"><LocalizedText messageKey="message381" /></SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tenant / Region Selector */}
        <div className="flex-1 w-full space-y-[12px]">
          <Label><LocalizedText messageKey="message376" /></Label>
          <Select>
            <SelectTrigger className="h-[52px] border-gray-200 rounded-[12px] focus:ring-primary w-full">
              <SelectValue placeholder={getLocalizedMessage("message030")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all"><LocalizedText messageKey="message030" /></SelectItem>
              <SelectItem value="north"><LocalizedText messageKey="message247" /></SelectItem>
              <SelectItem value="europe"><LocalizedText messageKey="message120" /></SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Export Reports Section */}
        <div className="flex-1 w-full space-y-[12px]">
          <Label><LocalizedText messageKey="message122" /></Label>
          <div className="flex gap-[12px] overflow-x-auto scroll-hidden">
            <Button
              variant="outline"
              className="h-[52px] flex-1 flex items-center justify-center gap-2 border-gray-200 rounded-[12px] text-gray font-medium hover:bg-gray-50 transition-colors"
            >
              <FileText size={18} className="text-gray-400" />
              <LocalizedText messageKey="message083" />
            </Button>

            <Button
              variant="outline"
              className="h-[52px] flex-1 flex items-center justify-center gap-2 border-gray-200 rounded-[12px] text-gray font-medium hover:bg-gray-50 transition-colors"
            >
              <FileText size={18} className="text-gray-400" />
              <LocalizedText messageKey="message121" />
            </Button>

            <Button
              variant="outline"
              className="h-[52px] flex-1 flex items-center justify-center gap-2 border-gray-200 rounded-[12px] text-gray font-medium hover:bg-gray-50 transition-colors"
            >
              <FileText size={18} className="text-gray-400" />
              PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}