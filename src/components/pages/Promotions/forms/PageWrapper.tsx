"use client";
import Container from "@/components/common/Container";
import { FormLayout } from "@/components/common/FormLayout";
import PageHeader from "@/components/common/PageHeader";
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
    <Container>
      <PageHeader
        title={title}
        actions={showActions ? (
          <>
            {onReset ? (
              <Button
                type="button"
                variant="outline"
                onClick={onReset}
                disabled={saving}
              >
                {t("reset")}
              </Button>
            ) : null}

            {onSave ? (
              <Button
                type="button"
                onClick={onSave}
                disabled={saving}
              >
                {saving ? t("saving") : t("save")}
              </Button>
            ) : null}
          </>
        ) : undefined}
      />
      <FormLayout>{children}</FormLayout>
    </Container>
  );
}
