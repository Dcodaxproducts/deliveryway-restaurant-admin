"use client";

import { BranchCard } from "@/components/cards/BranchCard";
import type { DataTableColumn } from "@/components/common/DataTable";
import { ResponsiveDataView } from "@/components/common/ResponsiveDataView";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import type { BranchProps } from "@/types/branch";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useRouter } from "next/navigation";

export type BranchListItem = {
  id: string;
  name: string;
  city?: string;
  address?:
    | string
    | {
        street?: string | null;
        shopNumber?: string | null;
        postalCode?: string | null;
        city?: string | null;
        area?: string | null;
        state?: string | null;
        country?: string | null;
      }
    | null;
  phone?: string;
  isActive?: boolean;
  availability?: BranchProps["availability"];
  isMain?: boolean;
  coverImage?: string;
  logoUrl?: string;
};

const text = (value: unknown) =>
  typeof value === "string" || typeof value === "number" ? String(value).trim() : "";

export const formatBranchAddress = (address: BranchListItem["address"]) => {
  if (typeof address === "string") return address.trim();
  if (!address) return "";

  const streetLine = [address.street, address.shopNumber].map(text).filter(Boolean).join(" ");
  const cityLine = [address.postalCode, address.city].map(text).filter(Boolean).join(" ");

  return [streetLine, cityLine, address.area, address.state, address.country]
    .map(text)
    .filter(Boolean)
    .join(", ");
};

interface Props {
  branches?: BranchListItem[];
  loading?: boolean;
  error?: string | null;
}

export default function BranchesList({ branches = [], loading, error }: Props) {
  const commonT = useTranslations("common");
  const branchesT = useTranslations("branches");
  const router = useRouter();
  const columns = useMemo<readonly DataTableColumn<BranchListItem>[]>(
    () => [
      {
        id: "name",
        header: commonT("name"),
        cell: (branch) => (
          <div>
            <p className="font-semibold text-[var(--ui-text)]">{branch.name || "-"}</p>
            {branch.isMain ? (
              <p className="mt-0.5 text-xs text-[var(--ui-text-muted)]">{branchesT("mainBranch")}</p>
            ) : null}
          </div>
        ),
      },
      {
        id: "location",
        header: commonT("address"),
        cell: (branch) => formatBranchAddress(branch.address) || branch.city || "-",
      },
      {
        id: "phone",
        header: commonT("phone"),
        cell: (branch) => branch.phone || "-",
      },
      {
        id: "status",
        header: commonT("status"),
        cell: (branch) => (
          <StatusBadge tone={branch.isActive === false ? "neutral" : "success"}>
            {branch.isActive === false ? commonT("inactive") : commonT("active")}
          </StatusBadge>
        ),
      },
      {
        id: "actions",
        header: commonT("actions"),
        align: "right",
        cell: (branch) => (
          <Button variant="outline" size="sm" onClick={() => router.push(`/branches/${branch.id}`)}>
            {commonT("viewDetails")}
          </Button>
        ),
      },
    ],
    [branchesT, commonT, router],
  );

  return (
    <ResponsiveDataView
      data={branches}
      columns={columns}
      rowKey={(branch) => branch.id}
      loading={loading}
      error={error}
      errorTitle={commonT("unableToLoad")}
      emptyTitle={commonT("emptyBranchesTitle")}
      emptyDescription={commonT("emptyBranchesDescription")}
      renderMobileItem={({ id, name, isActive, availability, isMain, coverImage, logoUrl }) => (
          <BranchCard
            key={id}
            id={id}
            name={name}
            isActive={isActive}
            availability={availability}
            loading={loading}
            isDefault={isMain}
            itemsCount={0}
            openDialog={(branchId) => router.push(`/branches/${branchId}`)}
            coverImage={coverImage}
            logoUrl={logoUrl}
          />
      )}
    />
  );
}
