"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Info } from "lucide-react";
import AsyncSelect from "../ui/AsyncSelect";

interface Props {
  formData: any;
  setFormData: (data: any) => void;
  selectedBranch: any;
  setSelectedBranch: (val: any) => void;
  fetchBranches: any;
  branchLocked?: boolean;
}

const DeliveryManForm = ({
  formData,
  setFormData,
  selectedBranch,
  setSelectedBranch,
  fetchBranches,
  branchLocked = false,
}: Props) => {
  const handleChange = (field: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="bg-white rounded-[14px] p-[30px] h-fit overflow-visible">
      <div className="grid grid-cols-12 gap-[48px] overflow-visible">
        <div className="col-span-4 space-y-[64px]">
          <SectionTitle title="Setup Basic Info" />
        </div>

        <div className="col-span-8 space-y-[40px] overflow-visible">
          <section className="space-y-[24px] overflow-visible">
            <div className="grid grid-cols-2 gap-[24px]">
              <FormField
                label="First Name *"
                value={formData.firstName}
                onChange={(v) => handleChange("firstName", v)}
              />

              <FormField
                label="Last Name *"
                value={formData.lastName}
                onChange={(v) => handleChange("lastName", v)}
              />
            </div>

            <div className="grid grid-cols-2 gap-[24px]">
              <FormField
                label="Phone Number *"
                value={formData.phone}
                onChange={(v) => handleChange("phone", v)}
              />

              <FormField
                label="Email"
                value={formData.email}
                onChange={(v) => handleChange("email", v)}
              />
            </div>

            <div className="grid grid-cols-2 gap-[24px]">
              <FormField
                label="Vehicle Type"
                value={formData.vehicleType}
                onChange={(v) => handleChange("vehicleType", v)}
              />

              <FormField
                label="Vehicle Number"
                value={formData.vehicleNumber}
                onChange={(v) => handleChange("vehicleNumber", v)}
              />
            </div>

            <div className="space-y-[6px] overflow-visible h-[55vh]">
              <Label>Branch *</Label>

              {branchLocked ? (
                <Input
                  value={selectedBranch?.name || selectedBranch?.id || "Assigned branch"}
                  readOnly
                  className="h-[44px] border-[#BBBBBB] bg-gray-50 text-gray-600"
                />
              ) : (
                <AsyncSelect
                  value={selectedBranch}
                  onChange={setSelectedBranch}
                  placeholder="Select Branch"
                  fetchOptions={fetchBranches}
                />
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DeliveryManForm;

/* helpers */

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-[12px]">
      <Info size={18} className="text-gray-400" />
      <span className="text-base font-semibold text-[#646982]">{title}</span>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-[6px]">
      <Label>{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-[44px] border-[#BBBBBB]"
      />
    </div>
  );
}