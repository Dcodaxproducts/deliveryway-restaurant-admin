import { AddNewPromotion } from "@/components/pages/Promotions/forms/AddNewPromotion/AddNewPromotion";

type AddPromotionPageProps = {
  promotionId?: string | null;
};

export function AddPromotionPage({ promotionId }: AddPromotionPageProps) {
  return <AddNewPromotion promotionId={promotionId} />;
}
