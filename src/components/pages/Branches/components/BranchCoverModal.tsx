"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import ImageDropzoneUpload from "@/components/ui/ImageDropzoneUpload";
import { useUpdateBranchImages } from "@/hooks/useBranches";
import { getApiErrorMessage } from "@/lib/errors";
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
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to update branch images."));
    }
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
          <ImageDropzoneUpload
            label={t("coverImage")}
            value={coverUrl || coverPreview}
            previewUrl={coverPreview}
            previewAlt={t("coverImage")}
            onPreviewChange={setCoverPreview}
            onChange={(fileUrl) => {
              setCoverUrl(fileUrl);
              setCoverPreview(fileUrl);
            }}
            onClear={() => {
              setCoverUrl(null);
              setCoverPreview(null);
            }}
            emptyTitle={t("uploadCover")}
            uploadedTitle={t("coverImage")}
            replaceHint={t("changeCover")}
            previewHeightClassName="h-[180px]"
          />

          <ImageDropzoneUpload
            label={t("logo")}
            value={logoUploadedUrl || logoPreview}
            previewUrl={logoPreview}
            previewAlt={t("logo")}
            onPreviewChange={setLogoPreview}
            onChange={(fileUrl) => {
              setLogoUploadedUrl(fileUrl);
              setLogoPreview(fileUrl);
            }}
            onClear={() => {
              setLogoUploadedUrl(null);
              setLogoPreview(null);
            }}
            emptyTitle={t("uploadLogo")}
            helperText={t("squareImageRecommended")}
            uploadedTitle={t("logo")}
            replaceHint={t("replaceLogo")}
            previewHeightClassName="h-32"
          />

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
