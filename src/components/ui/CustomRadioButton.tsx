// components/ui/CustomRadioButton.tsx
import { Label } from "@/components/ui/label";

type CustomRadioButtonProps = {
  value: string;
  label: string;
  active: boolean;
  onClick: (value: string) => void;
};

export default function CustomRadioButton({
  value,
  label,
  active,
  onClick,
}: CustomRadioButtonProps) {
  return (
    <label
      className="flex items-center gap-[8px] cursor-pointer"
      onClick={() => onClick(value)} // Handle click event
    >
      {/* Custom Radio Button */}
      <div
        className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
          active ? "border-red-700 bg-red-700" : "border-red-700 bg-white"
        }`}
      >
        {active && <div className="h-2 w-2 rounded-full bg-white" />} {/* Inner circle */}
      </div>

      <span className="text-sm">{label}</span>
    </label>
  );
}
