import { LocalizedText } from "@/components/common/LocalizedText";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calendar } from "lucide-react";  // Assuming you're using Lucide icons for the calendar
import { useState } from "react";

const AnalyticsFilter = () => {
  const [selectedFilter, setSelectedFilter] = useState<string>("Today");

  const handleSelectFilter = (filter: string) => {
    setSelectedFilter(filter);
  };

  return (
    <div className="flex items-center justify-end space-x-4 p-4 bg-white">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center space-x-2 text-gray-500"
          >
            <span>{selectedFilter}</span>
            <Calendar size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleSelectFilter("Today")}>
            <LocalizedText messageKey="message384" />
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSelectFilter("This Week")}>
            <LocalizedText messageKey="message383" />
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSelectFilter("This Month")}>
            <LocalizedText messageKey="message381" />
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSelectFilter("Last Month")}>
            <LocalizedText messageKey="message166" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default AnalyticsFilter;
