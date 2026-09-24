import { Button } from "@/components/ui/button";

export function ReportSummaryError({
  message,
  retryLabel,
  onRetry,
}: {
  message: string;
  retryLabel: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-xl border border-red-200 bg-red-50 p-6 text-center"
    >
      <p className="text-sm font-medium text-red-700">{message}</p>
      <Button type="button" variant="outline" onClick={onRetry}>
        {retryLabel}
      </Button>
    </div>
  );
}
