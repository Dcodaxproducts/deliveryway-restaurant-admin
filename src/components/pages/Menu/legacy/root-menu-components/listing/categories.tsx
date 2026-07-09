"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, PlusCircle, X } from "lucide-react";
import CreateCategoryModalParent from "./CreateCategoryModalParent";
import useCategories from "@/hooks/useCategories";
import DeleteDialog from "@/components/common/dialogs/delete-dialog";
import { useTranslations } from "next-intl";

interface CategoriesProps {
  editing?: boolean;
  showAddNew?: boolean;
  selectedCategory: string | null;
  onSelectCategory: (id: string) => void;
}

export default function Categories({
  editing,
  showAddNew = true,
  selectedCategory,
  onSelectCategory,
}: CategoriesProps) {
  const t = useTranslations("menu.listingCategories");
  const { categories, loading, deleteCategory, refetch } = useCategories();
  const [createCategory, setCreateCategory] = useState(false);
const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
const [isDeleting, setIsDeleting] = useState(false);
const [categoryPage, setCategoryPage] = useState(0);
const categoriesPerPage = 10;
const totalCategoryPages = Math.max(1, Math.ceil(categories.length / categoriesPerPage));
const visibleCategories = categories.slice(
  categoryPage * categoriesPerPage,
  categoryPage * categoriesPerPage + categoriesPerPage,
);

const handleDeleteCategory = async () => {
  if (!deletingCategoryId) return;

  try {
    setIsDeleting(true);
    await deleteCategory(deletingCategoryId);
    setDeleteDialogOpen(false);
    setDeletingCategoryId(null);
    refetch();
  } catch (error) {
    void error;
  } finally {
    setIsDeleting(false);
  }
};

const handleModalChange = (open: boolean) => {
  setCreateCategory(open);

  // when modal closes
  if (!open) {
    refetch();
  }
};
useEffect(()=>{
  refetch();
},[])
useEffect(() => {
  if (categoryPage > totalCategoryPages - 1) {
    setCategoryPage(Math.max(0, totalCategoryPages - 1));
  }
}, [categoryPage, totalCategoryPages]);
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[24px] font-semibold text-gray-900">
          {t("title")}
        </h2>

        <div className="flex items-center gap-2">
          {totalCategoryPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={categoryPage === 0}
                onClick={() => setCategoryPage((page) => Math.max(0, page - 1))}
                className="h-9 w-9 rounded-[10px] border-gray-200 text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-md disabled:opacity-40"
                aria-label="Show previous categories"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={categoryPage >= totalCategoryPages - 1}
                onClick={() =>
                  setCategoryPage((page) => Math.min(totalCategoryPages - 1, page + 1))
                }
                className="h-9 w-9 rounded-[10px] border-gray-200 text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-md disabled:opacity-40"
                aria-label="Show next categories"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {showAddNew && (
          <div className="text-center">
            <Button
              variant="link"
              size="sm"
              className="inline-flex items-center gap-2 text-primary underline hover:no-underline font-semibold text-[16px]"
              onClick={() => setCreateCategory(true)}
            >
              <PlusCircle className="w-4 h-4" />
              {t("addNewCategory")}
            </Button>
          </div>
          )}
        </div>
      </div>

      {/* Category Pills */}

  {loading ? (
  <div className="flex flex-wrap gap-x-3 gap-y-5 max-w-[900px]">
    {[...Array(6)].map((_, i) => (
      <div
        key={i}
        className="relative h-[42px] w-[140px] rounded-[12px] border border-gray-200 bg-white px-4 py-2 animate-pulse overflow-hidden"
      >
        {/* soft shimmer */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-gray-100 to-transparent" />

        {/* fake text line */}
        <div className="relative z-10 h-4 w-20 rounded bg-gray-200 mt-1" />
      </div>
    ))}
  </div>
) : (
        <div className="flex flex-wrap gap-x-3 gap-y-5 max-w-[900px]">
          {visibleCategories.map((category) => {
            const isActive = selectedCategory === category.id;

            return (
              <div key={category.id} className="relative">
                <Button
                  onClick={() => onSelectCategory(category.id)}
                  variant="outline"
                  className={`
                    rounded-[12px]
                    px-5
                    py-2
                    text-sm
                    font-medium
                    transition
                    ${
                      isActive
                        ? "bg-primary text-white border-primary hover:bg-primary hover:text-white hover:shadow-md"
                        : "text-[#6A7282] border-[#6A7282] bg-transparent hover:bg-transparent hover:text-[#6A7282] hover:shadow-md"
                    }
                  `}
                >
                  {category.name}
                </Button>

                {/* Delete button */}
                {editing && (
                  <button
                   onClick={() => {
      setDeletingCategoryId(category.id);
      setDeleteDialogOpen(true);
    }}
                    className="
                      absolute
                      -top-1
                      -right-1
                      bg-[#c6c6c6]
                      text-black
                      border border-black
                      rounded-full
                      p-0.5
                      shadow-md
                      hover:bg-red-600
                    "
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

     <CreateCategoryModalParent
  open={createCategory}
  onOpenChange={handleModalChange}
/>
<DeleteDialog
  open={deleteDialogOpen}
  onOpenChange={(open) => {
    setDeleteDialogOpen(open);
    if (!open) setDeletingCategoryId(null);
  }}
  onConfirm={handleDeleteCategory}
  isLoading={isDeleting}
  title={t("deleteTitle")}
  description={t("deleteDescription", {
    name: categories.find((c) => c.id === deletingCategoryId)?.name || t("thisCategory"),
  })}
/>
    </div>
  );
}
