import * as React from "react";
import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type FileUploadControlProps = Omit<
  React.ComponentProps<typeof Input>,
  "type"
> & {
  buttonLabel: string;
  fileName?: string;
};

function FileUploadControl({
  buttonLabel,
  className,
  fileName,
  id,
  ...props
}: FileUploadControlProps) {
  return (
    <div
      data-slot="file-upload-control"
      className={cn("flex min-w-0 items-center gap-3", className)}
    >
      <Input id={id} type="file" className="sr-only" {...props} />
      <Button asChild variant="outline" size="sm">
        <label htmlFor={id} className="cursor-pointer">
          <Upload aria-hidden="true" />
          {buttonLabel}
        </label>
      </Button>
      {fileName ? (
        <span className="min-w-0 truncate text-sm text-muted-foreground">
          {fileName}
        </span>
      ) : null}
    </div>
  );
}

export { FileUploadControl };
