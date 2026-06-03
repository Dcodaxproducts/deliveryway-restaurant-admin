import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

export default function OrderTypesCard({
  types,
  title,
}: {
  types: string[];
  title?: string;
}) {
  const t = useTranslations("branches");
  const commonT = useTranslations("common");

  return (
    <Card className="p-4 bg-[#F5F5F5] rounded-lg border-none">
      <h3 className="text-sm font-semibold text-center text-black">
        {title || t("availableOrderTypes")}
      </h3>

      <div className="flex flex-wrap gap-2 justify-center mt-2">
        {types.length > 0 ? (
          types.map((type, i) => (
            <Badge key={i} variant="outline" className="text-xs">
              {type.replace("_", " ")}
            </Badge>
          ))
        ) : (
          <span className="text-xs text-gray-400">{commonT("noData")}</span>
        )}
      </div>
    </Card>
  );
}
