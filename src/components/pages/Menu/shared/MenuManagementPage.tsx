import type { ReactNode } from "react";

import Container from "@/components/common/Container";
import PageHeader from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";

type MenuManagementPageProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function MenuManagementPage({
  title,
  description,
  actions,
  children,
}: MenuManagementPageProps) {
  return (
    <Container>
      <PageHeader title={title} description={description} actions={actions} />
      <SectionCard padding="md">{children}</SectionCard>
    </Container>
  );
}
