"use client";

import { useState, type ChangeEvent } from "react";
import { toast } from "sonner";

import { getApiErrorMessage } from "@/lib/errors";
import { prepareUploadFile } from "@/lib/prepare-upload-file";
import { createPresignedUpload } from "@/services/storage";

interface UploadResult {
  key: string;
  fileUrl: string;
}

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (event: ChangeEvent<HTMLInputElement>): Promise<UploadResult | null> => {
    const file = event.target.files?.[0];
    if (!file) return null;

    try {
      setUploading(true);

      const prepared = await prepareUploadFile(file);

      const presigned = await createPresignedUpload({
        fileName: prepared.file.name,
        contentType: prepared.file.type,
      });

      const uploadData = presigned?.data;

      if (!uploadData?.uploadUrl || !uploadData?.key) {
        throw new Error("Invalid presigned upload response");
      }

      const uploadResponse = await fetch(uploadData.uploadUrl, {
        method: uploadData.method || "PUT",
        headers: {
          ...(uploadData.headers || {}),
        },
        body: prepared.file,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file to storage");
      }

      toast.success("File uploaded");

      return {
        key: uploadData.key,
        fileUrl: uploadData.fileUrl,
      };
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Upload failed"));
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { uploadFile, uploading };
};
