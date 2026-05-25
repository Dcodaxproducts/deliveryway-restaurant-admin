
export function Radio({
  label,
  active = false,
}: {
  label: string;
  active?: boolean;
}) {
  return (
    <label className="flex items-center gap-[8px] cursor-pointer">
      <span
        className={`size-[18px] rounded-full border flex items-center justify-center
        ${active ? "border-primary" : "border-gray-500"}`}
      >
        {active && (
          <span className="size-[10px] rounded-full bg-primary" />
        )}
      </span>
      <span className="text-sm text-dark">{label}</span>
    </label>
  );
}
