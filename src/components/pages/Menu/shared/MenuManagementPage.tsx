"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import Container from "@/components/common/Container";
import { PageActionGroup } from "@/components/common/PageActionGroup";
import PageHeader from "@/components/common/PageHeader";

type MenuManagementPageProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

const MenuManagementActionsTarget = createContext<
  HTMLElement | null | undefined
>(undefined);

export function MenuManagementActions({ children }: { children: ReactNode }) {
  const target = useContext(MenuManagementActionsTarget);

  if (target === undefined) {
    return (
      <PageActionGroup className="mb-4 justify-end">{children}</PageActionGroup>
    );
  }

  return target ? createPortal(children, target) : null;
}

export function MenuManagementPage({
  title,
  description,
  actions,
  children,
}: MenuManagementPageProps) {
  const [actionsTarget, setActionsTarget] = useState<HTMLDivElement | null>(
    null,
  );

  return (
    <Container>
      <PageHeader
        title={title}
        description={description}
        actions={
          <>
            {actions}
            <div ref={setActionsTarget} className="contents" />
          </>
        }
      />
      <MenuManagementActionsTarget.Provider value={actionsTarget}>
        {children}
      </MenuManagementActionsTarget.Provider>
    </Container>
  );
}
