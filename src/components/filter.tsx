"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import ExportSection from "./export";

export default function Filters({ type }: { type?: string }) {
    return (
        <div className="bg-white p-4 lg:p-[24px] rounded-[14px] lg:border-2 border-[#F3F4F6] space-y-[30px]">
            <div className="flex flex-col gap-[20px] md:flex-row md:items-end md:flex-wrap">
                <div className="flex-1 min-w-[280px] space-y-[6px]">
                    <Label>Search</Label>
                    <div className="relative">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            size={18}
                        />
                        <Input
                            placeholder="Search by restaurant name or domain"
                            className="pl-10 border-[#BBBBBB] focus-visible:ring-primary"
                        />
                    </div>
                </div>

                <div className="w-full md:w-[200px] space-y-[6px]">
                    <Label>Status</Label>
                    <Select>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="disabled">Disabled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {
                    type === "restaurant" && <div className="w-full md:w-[220px] space-y-[6px]">
                        <Label>Business Model</Label>
                        <Select>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Model" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="commission">Commission</SelectItem>
                                <SelectItem value="subscription">Subscription</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                }
            </div>
            {
                type !== "restaurant" &&
                <div>
                    <ExportSection />
                </div>
            }
        </div>
    );
}