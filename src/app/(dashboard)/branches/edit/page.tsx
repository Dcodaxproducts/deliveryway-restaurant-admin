import { BranchesEditPage } from "@/components/pages/branches/pages/EditBranchPage";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const branchIdParam = params?.branchId;
  const requestedBranchId = Array.isArray(branchIdParam)
    ? branchIdParam[0] ?? null
    : branchIdParam ?? null;

  return <BranchesEditPage requestedBranchId={requestedBranchId} />;
}
