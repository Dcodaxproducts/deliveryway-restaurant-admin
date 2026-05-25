"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Info } from "lucide-react";

export default function SettingsForm() {
    const [currencyFormat, setCurrencyFormat] = useState("prefix");
    const [dateFormat, setDateFormat] = useState("dd/mm/yyyy");

    return (
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-[48px] p-4 lg:p-[30px] bg-white rounded-[14px]">
            <div className="hidden lg:block lg:col-span-4 space-y-8 relative">
                <div className={`flex items-center gap-[12px] cursor-pointer`}>
                    <Info size={18} className="text-gray" />
                    <span className={`text-base font-semibold text-[#646982] group-hover:text-primary transition-colors`}>Tax Settings</span>
                </div>
                <div className={`flex items-center gap-[12px] cursor-pointer absolute top-88`}>
                    <Info size={18} className="text-gray" />
                    <span className={`text-base font-semibold text-[#646982] group-hover:text-primary transition-colors`}>Commission Settings</span>
                </div>
                <div className={`flex items-center gap-[12px] cursor-pointer absolute top-143`}>
                    <Info size={18} className="text-gray" />
                    <span className={`text-base font-semibold text-[#646982] group-hover:text-primary transition-colors`}>Currency Settings</span>
                </div>
                <div className={`flex items-center gap-[12px] cursor-pointer absolute bottom-143`}>
                    <Info size={18} className="text-gray" />
                    <span className={`text-base font-semibold text-[#646982] group-hover:text-primary transition-colors`}>Localization Settings</span>
                </div>
                <div className={`flex items-center gap-[12px] cursor-pointer absolute bottom-70`}>
                    <Info size={18} className="text-gray" />
                    <span className={`text-base font-semibold text-[#646982] group-hover:text-primary transition-colors`}>Branding (Quick Setup)</span>
                </div>
            </div>

            {/* Form Content */}
            <div className="lg:col-span-8 space-y-[48px]">

                {/* Section: Tax Settings */}
                <section className="space-y-[24px]">
                    <div className="space-y-[6px]">
                        <Label>Global Tax %</Label>
                        <p className="text-sm text-gray mb-2">Set the default tax percentage applied to transactions across the platform.</p>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark font-medium">%</span>
                            <Input placeholder="Add Percentage" className="pl-8 border-[#BBBBBB] focus:border-primary" />
                        </div>
                    </div>

                    <div className="space-y-[6px]">
                        <Label>VAT/GST handling rules</Label>
                        <p className="text-sm text-gray">Choose how VAT/GST should be calculated and displayed system-wide.</p>
                        <RadioGroup defaultValue="inclusive" className="space-y-[24px]">
                            <div className="flex items-center gap-3">
                                <RadioGroupItem value="inclusive" className="border-dark" />
                                <Label>Prices are inclusive of tax</Label>
                            </div>
                            <div className="flex items-center gap-3">
                                <RadioGroupItem value="exclusive" className="border-dark" />
                                <Label>Prices are exclusive of tax</Label>
                            </div>
                            <div className="flex items-center gap-3">
                                <RadioGroupItem value="completed" className="border-dark" />
                                <Label>Tax applies only to completed transactions</Label>
                            </div>
                        </RadioGroup>
                    </div>
                </section>

                {/* Section: Commission Settings */}
                <section className="space-y-[24px]">
                    <FormGroup label="Default Commission (%)" placeholder="Add Percentage" prefix="%" />
                    <FormGroup label="Default Hybrid Fee (%)" placeholder="Add Percentage" prefix="%" />
                </section>

                {/* Section: Currency Settings */}
                <section className="space-y-[24px]">
                    <div className="space-y-[6px]">
                        <Label>Default Platform Currency</Label>
                        <p className="text-sm text-gray mb-2">This currency will be used as the default for all monetary values.</p>
                        <Select>
                            <SelectTrigger className="h-[52px] border-[#BBBBBB]">
                                <div className="flex items-center gap-2">
                                    <span className="text-dark">$</span>
                                    <SelectValue placeholder="Select Currency" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="usd">USD</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-[12px]">
                        <Label>Currency Display Format</Label>
                        <div className="grid grid-cols-3 gap-4">
                            <FormatBtn label="$1,000.00" active={currencyFormat === "prefix"} onClick={() => setCurrencyFormat("prefix")} />
                            <FormatBtn label="1,000.00 USD" active={currencyFormat === "suffix"} onClick={() => setCurrencyFormat("suffix")} />
                            <FormatBtn label="USD 1,000.00" active={currencyFormat === "iso"} onClick={() => setCurrencyFormat("iso")} />
                        </div>
                    </div>
                </section>

                {/* Section: Localization Settings */}
                <section className="space-y-[24px]">
                    <FormGroup label="Default Platform Language" type="select" placeholder="Select Language" />

                    <div className="space-y-[12px]">
                        <Label>Date Format</Label>
                        <div className="grid grid-cols-3 gap-2">
                            <FormatBtn label="DD/MM/YYYY" active={dateFormat === "dd/mm/yyyy"} onClick={() => setDateFormat("dd/mm/yyyy")} />
                            <FormatBtn label="MM/DD/YYYY" active={dateFormat === "mm/dd/yyyy"} onClick={() => setDateFormat("mm/dd/yyyy")} />
                            <FormatBtn label="YYYY-MM-DD" active={dateFormat === "yyyy-mm-dd"} onClick={() => setDateFormat("yyyy-mm-dd")} />
                        </div>
                    </div>

                    <FormGroup label="Timezone" type="select" placeholder="Select Timezone" />
                </section>

                {/* Section: Branding */}
                <section className="space-y-[24px]">
                    <div className="grid grid-cols-2 gap-[24px]">
                        <div className="space-y-[6px]">
                            <Label>Primary Color</Label>
                            <div className="flex gap-2">
                                <div className="size-[52px] rounded-md bg-primary shrink-0" />
                                <div className="relative w-full">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray">#</span>
                                    <Input placeholder="Add Color Code" className="pl-7 border-[#BBBBBB] focus:border-primary" />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-[6px]">
                            <Label>Secondary Color</Label>
                            <div className="flex gap-2">
                                <div className="size-[52px] rounded-md bg-black shrink-0" />
                                <div className="relative w-full">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray">#</span>
                                    <Input placeholder="Add Color Code" className="pl-7 border-[#BBBBBB] focus:border-primary" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <FormGroup label="Font Selection (Optional)" type="select" placeholder="Select font" />
                </section>

                {/* Footer Actions */}
                <section className="flex flex-col sm:flex-row gap-4 justify-end">
                    <Button variant="outline" className="h-[52px] px-10 rounded-[10px] text-dark border-gray-200">Cancel</Button>
                    <Button variant="default" className="h-[52px] px-10 rounded-[10px]">Save & Activate</Button>
                </section>
            </div>
        </div>
    );
}

function FormGroup({ label, placeholder, type = "text", prefix }: { label: string; placeholder: string; type?: string; prefix?: string }) {
    return (
        <div className="space-y-[6px]">
            <Label>{label}</Label>
            {type === "select" ? (
                <Select>
                    <SelectTrigger className="h-[52px] border-[#BBBBBB] focus:border-primary">
                        <SelectValue placeholder={placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="opt1">{placeholder}</SelectItem>
                    </SelectContent>
                </Select>
            ) : (
                <div className="relative">
                    {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark font-medium">{prefix}</span>}
                    <Input placeholder={placeholder} className={`${prefix ? "pl-8" : ""} border-[#BBBBBB] focus:border-primary`} />
                </div>
            )}
        </div>
    );
}

function FormatBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`h-[52px] text-xs lg:text-base rounded-[10px] border transition-all ${active ? "border-primary text-primary" : "border-[#BBBBBB] text-gray"
                }`}
        >
            {label}
        </button>
    );
}