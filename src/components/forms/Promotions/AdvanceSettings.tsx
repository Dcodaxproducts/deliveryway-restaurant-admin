"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdvanceSettings({
  branches,
}: {
  branches: any[];
}) {
  return (
    <div className="space-y-6">
      <div>
        <Label>Specific Branch</Label>

        <Select>
          <SelectTrigger className="h-10">
            <SelectValue placeholder="Select branch" />
          </SelectTrigger>
<div className="mt-10">
          <SelectContent>
            {branches.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent></div>
        </Select>

        {/* <div className="mt-2">
          <Switch />
        </div> */}
      </div>
    </div>
  );
}