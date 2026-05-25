"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useCreateBranchesBulk } from "@/hooks/useBranches";

import { validateSchema } from "@/lib/zod-errors";
import {
  BulkBranchSchema,
  BulkBranchValues,
} from "@/validations/branches";

type ImportModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  subtitle?: string;
};

type BranchItem = BulkBranchValues["branches"][number];

export default function ImportModal({
  open,
  onOpenChange,
  title = "Import Branch List",
  subtitle = "Import Branch list for this restaurant",
}: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);

  const { user } = useAuth();
  const bulkMutation = useCreateBranchesBulk();

  /* ---------- FILE CHANGE ---------- */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const selected = event.target.files[0];

      if (selected.size > 2 * 1024 * 1024) {
        toast.error("File must be less than 2MB");
        return;
      }

      setFile(selected);
    }
  };

  /* ---------- PARSE CSV ---------- */
  const parseCSV = async (file: File): Promise<BranchItem[]> => {
    const text = await file.text();
    const rows = text.split("\n").map((row) => row.split(","));

    const headers = rows[0].map((h) => h.trim());

    return rows.slice(1).map((row) => {
      const obj: any = {};

      headers.forEach((header, index) => {
        obj[header] = row[index]?.trim();
      });

      return {
        name: obj.name || "",
        street: obj.street || "",
        city: obj.city || "",
        state: obj.state || "",
        country: obj.country || "",
        area: obj.area || "",
        lat: obj.lat || "",
        lng: obj.lng || "",
        isMain: obj.isMain === "true",

        settings: {
          allowedOrderTypes: ["DELIVERY"] as const,
          allowedPaymentMethods: ["COD"] as const,

          deliveryConfig: {
            radiusKm: 5,
            minOrderAmount: 0,
            deliveryFee: 0,
            isFreeDelivery: false,
            freeDeliveryThreshold: 0,
          },

          automation: {
            autoAcceptOrders: false,
            estimatedPrepTime: 0,
          },

          taxation: {
            taxPercentage: 0,
          },

          tableReservationsEnabled: false,

          contact: {
            phone: "",
            whatsapp: "",
          },
        },
      };
    });
  };

  /* ---------- IMPORT ---------- */
  const handleImport = async () => {
    try {
      if (!file) {
        toast.error("Please select a file");
        return;
      }

      const restaurantId = user?.restaurantId;
      if (!restaurantId) {
        toast.error("Restaurant not found");
        return;
      }

      const branches = await parseCSV(file);

      const payload: BulkBranchValues = {
        restaurantId,
        branches,
      };

      const result = validateSchema(BulkBranchSchema, payload);

      if (!result.success) {
        const formatted = Object.entries(result.errors)
          .map(([path, message]) => `${path}: ${message}`)
          .join("\n");

        toast.error(formatted);
        return;
      }

      await bulkMutation.mutateAsync(payload);

   
      setFile(null);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import failed");
    }
  };

  /* ---------- DOWNLOAD TEMPLATE ---------- */
  const handleDownload = () => {
    const csvContent = [
      [
        "name",
        "street",
        "city",
        "state",
        "country",
        "area",
        "lat",
        "lng",
        "isMain",
      ],
      [
        "Main Branch",
        "Street 12",
        "Lahore",
        "Punjab",
        "Pakistan",
        "DHA Phase 5",
        "31.5204",
        "74.3587",
        "true",
      ],
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "branch_import_template.csv";
    link.click();
  };

  /* ---------- UI ---------- */

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] rounded-[20px] p-7 bg-[#F5F5F5] max-h-[95vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-[24px] font-semibold">
            {title}
          </DialogTitle>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </DialogHeader>

        <div className="mt-4 rounded-[16px] bg-white p-6">
          <div className="flex flex-col items-center justify-center">
            <div
              onClick={() =>
                document.getElementById("fileInput")?.click()
              }
              className="w-full h-[180px] border-2 border-dashed border-gray-300 rounded-[16px] flex items-center justify-center cursor-pointer hover:border-gray-400 transition"
            >
              <img
                src="/excel.png"
                alt="Excel"
                className="w-[64px] h-[64px]"
              />
            </div>

            <p className="mt-4 text-xs text-gray-500 text-center">
              Format : csv | Size : Max 2 MB
            </p>

            {file && (
              <p className="mt-2 text-xs text-green-600">
                Selected: {file.name}
              </p>
            )}

            <input
              id="fileInput"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div
            onClick={handleDownload}
            className="mt-6 flex items-center justify-center flex-col gap-2 rounded-[12px] bg-[#EEF6FF] px-4 py-4 text-sm text-primary cursor-pointer border border-[#C0E1FC]"
          >
            <span className="text-gray-500">
              If you don't know the file format
            </span>

            <span className="font-semibold text-[#4153C4] underline">
              Download Empty File
            </span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-6">
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="px-6 py-2 rounded-[10px]"
          >
            Cancel
          </Button>

          <Button
            onClick={handleImport}
            disabled={bulkMutation.isPending}
            className="px-8 py-2.5 rounded-[10px] bg-primary text-white"
          >
            {bulkMutation.isPending ? "Importing..." : "Import"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
