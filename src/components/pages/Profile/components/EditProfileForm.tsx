import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, ChevronDown } from "lucide-react";

export default function EditProfile() {
  return (
      <Card className="w-full  p-10 rounded-2xl shadow-sm bg-white shadow-none border-none ">
        {/* ================= HEADER ================= */}
        <div className="flex flex-col items-center">
          {/* Avatar */}
          <div className="relative">
            <img
              src="/user-2.jpg"
              alt="avatar"
              className="w-44 h-44 rounded-2xl object-cover shadow-md"
            />

            {/* delete icon */}
            <button className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow border hover:bg-gray-50">
              <Trash2 size={16} className="text-red-500" />
            </button>
          </div>

          <h2 className="mt-6 text-2xl font-semibold text-[#030401]">
            Samantha Doe
          </h2>

          <p className="text-sm text-[#909090]">
            samantha123@example.com
          </p>

          <p className="text-sm text-[#909090] text-center max-w-lg mt-3 leading-relaxed">
            Authentic and fusion flavors made fresh every day using
            high-quality ingredients.
          </p>
        </div>

{/* ================= FORM ================= */}
<div className="mt-10 space-y-6 min-w-[70%] max-w-[80%] mx-auto ">
  {/* Row 1 */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
    <FormInput label="First Name *" placeholder="eg. jhon doe" />
    <FormInput label="Last Name *" placeholder="eg. jhon doe" />
  </div>

  {/* Row 2 */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
    <FormInput label="Phone Number *" placeholder="eg. jhon doe" />
    <FormInput label="Email *" placeholder="eg. jhon doe" />
  </div>

  {/* Description */}
  <FormInput label="Description *" placeholder="eg. jhon doe" full />

  {/* Address */}
  <FormInput
    label="Address"
    placeholder="742 Mission Street, Suite 300"
    full
  />

  {/* Row 3 */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
    <FormInput label="City" placeholder="eg. jhon doe" />
    <FormInput label="Country" placeholder="eg. jhon doe" />
  </div>

  {/* Typography select */}
  <SelectInput label="Typography" value="Onest" />

  {/* ================= COLORS ================= */}
  <div className="pt-4">
    <h3 className="text-lg font-semibold mb-4">Select Colors</h3>

    <div className="space-y-4">
      <ColorSelect label="Primary Color" color="bg-red-600" text="Red" />
      <ColorSelect label="Secondary Color" color="bg-black" text="Black" />
    </div>
  </div>
</div>

      </Card>
    
  );
}

/* ================= SMALL REUSABLE COMPONENTS ================= */
function FormInput({
  label,
  placeholder,
  full,
}: {
  label: string;
  placeholder: string;
  full?: boolean;
}) {
  return (
    <div className={full ? "w-full" : ""}>
      <label className="text-sm font-medium text-gray-700 block mb-2">
        {label}
      </label>

      <Input
        placeholder={placeholder}
        className="h-11 w-full rounded-[9px] border-[#BBBBBB] focus-visible:ring-0 focus-visible:border-primary focus:border-2 focus:outline-none"
      />
    </div>
  );
}

function SelectInput({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 block mb-2">
        {label}
      </label>

      <div className="relative">
        <Input
          readOnly
          value={value}
          className="h-11 rounded-xl border-gray-200 pr-10 cursor-pointer"
        />
        <ChevronDown
          size={18}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
      </div>
    </div>
  );
}

function ColorSelect({
  label,
  color,
  text,
}: {
  label: string;
  color: string;
  text: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 block mb-2">
        {label}
      </label>

      <div className="relative flex items-center h-11 border border-gray-200 rounded-xl px-4">
        <span className={`w-4 h-4 rounded-full ${color} mr-3`} />
        <span className="text-sm text-gray-600">{text}</span>

        <ChevronDown
          size={18}
          className="absolute right-3 text-gray-400"
        />
      </div>
    </div>
  );
}
