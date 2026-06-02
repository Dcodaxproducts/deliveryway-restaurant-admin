import { SearchPage } from "@/components/pages/Search/SearchPage";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const queryParam = params?.query;
  const initialQuery = Array.isArray(queryParam) ? queryParam[0] ?? "" : queryParam ?? "";

  return <SearchPage initialQuery={initialQuery} />;
}
