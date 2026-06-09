"use client";
import { MUTED_TEXT_SM_CLASS } from "@/components/common/common-classes";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

interface PageWrapperProps {
  title: string;
  children: React.ReactNode;
  onReset?: () => void;
  onSave?: () => void;
  saving?: boolean;
}

export default function PageWrapper({
  title,
  children,
  onReset,
  onSave,
  saving = false,
}: PageWrapperProps) {
  const t = useTranslations("promotions.actions");
  const showActions = Boolean(onReset || onSave);

  return (
    <div className="w-full rounded-[14px] p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">{title}</h1>

        {showActions ? (
          <div className="flex items-center gap-4">
            {onReset ? (
              <button
                type="button"
                onClick={onReset}
                disabled={saving}
                className={`${MUTED_TEXT_SM_CLASS} hover:underline m-0 disabled:opacity-60`}
              >
                {t("reset")}
              </button>
            ) : null}

            {onSave ? (
              <Button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="bg-primary hover:bg-red-800 h-10 px-8 rounded-[12px] m-0"
              >
                {saving ? t("saving") : t("save")}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {children}
    </div>
  );
}
