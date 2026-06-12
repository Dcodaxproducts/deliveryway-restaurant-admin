import { AddPromotionPage } from "@/components/pages/promotions/pages/AddPromotionPage";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const idParam = params?.id;
  const promotionId = Array.isArray(idParam) ? idParam[0] ?? null : idParam ?? null;

  return <AddPromotionPage promotionId={promotionId} />;
}
