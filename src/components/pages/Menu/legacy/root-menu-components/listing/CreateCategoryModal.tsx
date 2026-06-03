"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { PlusCircle, X } from "lucide-react";
import FormSelect from "@/components/forms/common/FormSelect";
import { useTranslations } from "next-intl";


interface CreateMenuModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORY_OPTIONS = ["Food", "Beverages", "Desserts"];

export default function CreateCategoryModal({
  open,
  onOpenChange,
}: CreateMenuModalProps) {
  const t = useTranslations("menu.categoryPickerModal");
  const commonT = useTranslations("common");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categories, setCategories] = useState<string[]>(["Food"]);
  const [submitted, setSubmitted] = useState(false);

  /*  CONTROL SELECT OPEN STATE */
  const [selectOpen, setSelectOpen] = useState(false);

  const handleReset = () => {
    setSelectedCategory("");
    setCategories([]);
    setSubmitted(false);
    setSelectOpen(false);
  };

  const handleAddCategory = (val: string) => {
    if (!val) return;

    if (!categories.includes(val)) {
      setCategories((prev) => [...prev, val]);
    }

    setSelectedCategory("");
    setSelectOpen(false); // close after select
  };

  const handleRemoveCategory = (val: string) => {
    setCategories((prev) => prev.filter((c) => c !== val));
  };

  const handleCreate = () => {
    setSubmitted(true);

    if (categories.length === 0) return;

    onOpenChange(false);
    handleReset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] rounded-[20px] p-6 bg-[#F5F5F5] max-h-[95vh] overflow-auto">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-2xl font-semibold">
            {t("title")}
          </DialogTitle>
          <p className="text-sm text-gray-500">
            {t("description")}
          </p>
        </DialogHeader>

        <div className="mt-5 rounded-[16px] bg-white p-5 space-y-4">
          
          {/* Category */}
          <FormSelect
            label={commonT("category")}
            placeholder={t("selectCategory")}
            options={CATEGORY_OPTIONS}
            value={selectedCategory}
            open={selectOpen}
            onOpenChange={setSelectOpen}
            onChange={(val) => {
              setSelectedCategory(val);
              handleAddCategory(val);
            }}
          />

        {/* Selected Categories */}
{categories.length > 0 && (
  <div className="flex flex-wrap gap-x-3 gap-y-3 pt-2">
    {categories.map((cat) => (
      <div key={cat} className="relative">
        <Button
          variant="outline"
          className="
          h-[33px]
            relative
            rounded-[10px]
            px-3
            py-0
            text-[14px]
            font-medium
          text-[#6A7282] border-[#6A7282] bg-transparent
          "
        >
          <span className="capitalize">{cat}</span>
        </Button>

        {/*  Remove */}
        <button
          type="button"
          onClick={() => handleRemoveCategory(cat)}
          className="
            absolute
            -top-2
            -right-2
            bg-[#c6c6c6]
            text-black
            border
            border-black
            rounded-full
            p-0.5
            shadow-md
            hover:bg-red-600
            hover:text-white
          "
        >
          <X size={12} />
        </button>
      </div>
    ))}
  </div>
)}


         {/* Add more (only after first category) */}
{categories.length > 0 && (
  <div className="flex justify-center">
    <button
      type="button"
      onClick={() => setSelectOpen(true)}
      className="flex items-center gap-2 text-primary text-sm mt-2"
    >
      <PlusCircle size={18} />
      {t("addMoreCategories")}
    </button>
  </div>
)}


          {submitted && categories.length === 0 && (
            <p className="text-xs text-red-500 text-center">
              {t("required")}
            </p>
          )}
        </div>

        <div className="mt-5 flex items-center justify-center gap-4">
          <Button
            variant="ghost"
            className="text-gray-700 text-[17px]"
            onClick={handleReset}
          >
            {commonT("reset")}
          </Button>

          <Button
            onClick={handleCreate}
            className="px-8 py-2 rounded-[10px] bg-primary hover:bg-primary/90 text-[17px]"
          >
            {commonT("create")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
