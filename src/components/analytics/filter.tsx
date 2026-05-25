"use client";

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
          <Label>Date Range</Label>
          <Select>
            <SelectTrigger className="h-[52px] border-gray-200 rounded-[12px] focus:ring-primary w-full">
              <SelectValue placeholder="Select Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-7">Last 7 Days</SelectItem>
              <SelectItem value="last-30">Last 30 Days</SelectItem>
              <SelectItem value="this-month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tenant / Region Selector */}
        <div className="flex-1 w-full space-y-[12px]">
          <Label>Tenant / Region</Label>
          <Select>
            <SelectTrigger className="h-[52px] border-gray-200 rounded-[12px] focus:ring-primary w-full">
              <SelectValue placeholder="All Regions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              <SelectItem value="north">North America</SelectItem>
              <SelectItem value="europe">Europe</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Export Reports Section */}
        <div className="flex-1 w-full space-y-[12px]">
          <Label>Export Reports</Label>
          <div className="flex gap-[12px] overflow-x-auto scroll-hidden">
            <Button
              variant="outline"
              className="h-[52px] flex-1 flex items-center justify-center gap-2 border-gray-200 rounded-[12px] text-gray font-medium hover:bg-gray-50 transition-colors"
            >
              <FileText size={18} className="text-gray-400" />
              CSV
            </Button>

            <Button
              variant="outline"
              className="h-[52px] flex-1 flex items-center justify-center gap-2 border-gray-200 rounded-[12px] text-gray font-medium hover:bg-gray-50 transition-colors"
            >
              <FileText size={18} className="text-gray-400" />
              Excel
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