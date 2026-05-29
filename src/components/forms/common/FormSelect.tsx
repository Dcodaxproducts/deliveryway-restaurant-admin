"use client";

import { useId } from "react";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FormSelectProps {
  label?: string;
  placeholder: string;
  options: string[];
  value?: string;
  onChange?: (val: string) => void;
  id?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function FormSelect({
  label,
  placeholder,
  options,
  value,
  onChange,
  id,
  open,
  onOpenChange,
}: FormSelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div className="space-y-1">
      {label && (
        <Label htmlFor={selectId} className="text-[16px]">
          {label}
        </Label>
      )}

      <Select
        value={value}
        onValueChange={onChange}
        open={open}
        onOpenChange={onOpenChange}
      >
        <SelectTrigger
          id={selectId}
          className="h-[53px] rounded-[10px] border-[#BBBBBB] px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>

        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt.toLowerCase()}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
