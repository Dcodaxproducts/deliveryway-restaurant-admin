import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function OrderTypesCard({
  types,
  title = "Available Order Types",
}: {
  types: string[];
  title?: string;
}) {
  return (
    <Card className="p-4 bg-[#F5F5F5] rounded-lg border-none">
      <h3 className="text-sm font-semibold text-center text-black">
        {title}
      </h3>

      <div className="flex flex-wrap gap-2 justify-center mt-2">
        {types.length > 0 ? (
          types.map((type, i) => (
            <Badge key={i} variant="outline" className="text-xs">
              {type.replace("_", " ")}
            </Badge>
          ))
        ) : (
          <span className="text-xs text-gray-400">No data</span>
        )}
      </div>
    </Card>
  );
}