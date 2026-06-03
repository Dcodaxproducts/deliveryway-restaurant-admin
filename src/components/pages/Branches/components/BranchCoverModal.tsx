"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

import { useFileUpload } from "@/hooks/useFileUpload";
import { useUpdateBranchImages } from "@/hooks/useBranches";
import { useTranslations } from "next-intl";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
  branchName: string;
  coverImage?: string | null;
  logoUrl?: string | null;
}

export default function BranchCoverModal({
  open,
  onOpenChange,
  branchId,
  branchName,
  coverImage,
  logoUrl,
}: Props) {
  const t = useTranslations("branches");
  const commonT = useTranslations("common");
  const { uploadFile, uploading } = useFileUpload();
  const updateMutation = useUpdateBranchImages();

  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [logoUploadedUrl, setLogoUploadedUrl] = useState<string | null>(null);

  // ================= PREFILL =================
  useEffect(() => {
    if (open) {
      setCoverPreview(coverImage || null);
      setLogoPreview(logoUrl || null);
      setCoverUrl(null);
      setLogoUploadedUrl(null);
    }
  }, [open, coverImage, logoUrl]);

  // ================= HANDLERS =================
  const handleCoverChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const blob = URL.createObjectURL(file);
    setCoverPreview(blob);

    const res = await uploadFile(e);
    if (res?.fileUrl) setCoverUrl(res.fileUrl);
  };

  const handleLogoChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const blob = URL.createObjectURL(file);
    setLogoPreview(blob);

    const res = await uploadFile(e);
    if (res?.fileUrl) setLogoUploadedUrl(res.fileUrl);
  };

  // ================= SAVE =================
  const handleSave = async () => {
    if (!coverUrl && !logoUploadedUrl) {
      toast.error(t("uploadAtLeastOneImage"));
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: branchId,
        data: {
          ...(coverUrl && { coverImage: coverUrl }),
          ...(logoUploadedUrl && { logoUrl: logoUploadedUrl }),
        },
      });

      onOpenChange(false);
    } catch (err) {}
  };

  // ================= UI =================
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl">
        <div className="px-6 pt-5 pb-4 border-b bg-white">
          <h3 className="text-[16px] font-semibold text-gray-900">
            {t("customizeBranch")}
          </h3>
          <p className="text-xs text-gray-500 mt-1 truncate">
            {branchName}
          </p>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-6">
          <div>
            <p className="text-sm font-medium mb-2">{t("coverImage")}</p>

            <div className="relative group w-full h-[180px] rounded-xl overflow-hidden border bg-gray-50">
              {coverPreview ? (
                <>
                  <Image
                    src={coverPreview}
                    fill
                    alt={t("coverImage")}
                    className="object-cover"
                  />

                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-medium transition">
                      {t("changeCover")}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <ImageIcon size={28} className="mb-2 opacity-70" />
                  <span className="text-xs">{t("noCoverImage")}</span>
                </div>
              )}
            </div>

            <label className="mt-3 block">
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleCoverChange}
              />

              <Button
                variant="outline"
                className="w-full h-[40px] rounded-lg border-dashed text-sm flex items-center justify-center gap-2"
                asChild
              >
                <span>
                  {uploading ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Upload size={15} />
                  )}
                  {coverPreview ? t("replaceCover") : t("uploadCover")}
                </span>
              </Button>
            </label>
          </div>

          <div className="flex items-center gap-5">
            <div className="relative size-[90px] rounded-full overflow-hidden border bg-gray-50 flex items-center justify-center group">
              {logoPreview ? (
                <>
                  <Image
                    src={logoPreview}
                    fill
                    alt={t("logo")}
                    className="object-contain"
                  />

                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition">
                    <span className="opacity-0 group-hover:opacity-100 text-white text-[10px]">
                      {commonT("edit")}
                    </span>
                  </div>
                </>
              ) : (
                <Upload size={20} className="text-gray-400" />
              )}
            </div>

            <div className="flex-1">
              <p className="text-sm font-medium">{t("logo")}</p>
              <p className="text-xs text-gray-400 mb-2">
                {t("squareImageRecommended")}
              </p>

              <label>
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleLogoChange}
                />

                <Button
                  variant="outline"
                  className="h-[38px] rounded-lg text-sm flex items-center gap-2"
                  asChild
                >
                  <span>
                    {uploading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Upload size={14} />
                    )}
                    {logoPreview ? t("replaceLogo") : t("uploadLogo")}
                  </span>
                </Button>
              </label>
            </div>
          </div>

          {/* SAVE */}
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="w-full h-[44px] rounded-lg text-sm font-medium"
          >
            {updateMutation.isPending && (
              <Loader2 size={16} className="animate-spin mr-2" />
            )}
            {t("saveChanges")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
