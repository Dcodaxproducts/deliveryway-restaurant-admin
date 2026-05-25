"use client";

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

  /*  NEW (optional, backward-safe) */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function FormSelect({
  label,
  placeholder,
  options,
  value,
  onChange,
  open,
  onOpenChange,
}: FormSelectProps) {
  return (
    <div className="space-y-1">
      {label && <Label className="text-[16px]">{label}</Label>}

      <Select
        value={value}
        onValueChange={onChange}
        open={open}
        onOpenChange={onOpenChange}
      >
        <SelectTrigger className="border-[#BBBBBB] focus:ring-1 focus:ring-primary focus:border-primary h-[53px] rounded-[10px] px-3 text-sm">
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
