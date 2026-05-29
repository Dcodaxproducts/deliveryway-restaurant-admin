import { Card } from "@/components/ui/card";
function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] text-sm text-muted-foreground py-2">
      <span className="font-medium">{label}</span>
      <span className="px-2">:</span>
      <span className="text-right">{value}</span>
    </div>
  );
}  

export default function BranchInfoCard({ title, info }: { title: string; info: { label: string; value: string }[] }) {
  return (
    <Card className="p-4 bg-[#F5F5F5] rounded-lg border-none">
      <h3 className="text-sm font-semibold text-center text-black">{title}</h3>
      <div className="bg-white px-4 py-3 rounded-lg">
        {info.map((item, index) => (
          <InfoRow key={index} label={item.label} value={item.value} />
        ))}
      </div>
    </Card>
  );
}
