"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface Props {
  formData: any;
}

export default function StorePublished(_props: Props) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="w-full max-w-5xl bg-white rounded-xl p-12 text-center">
        {/* Heading */}
        <h1 className="text-[22px] font-semibold mb-2">
          Store Has Been Published
        </h1>

        <p className="text-sm text-gray-400 mb-10">
          Scan QR code or click the link below
        </p>

        {/* QR Card */}
        <div className="mx-auto bg-[#F8F8F8] rounded-2xl px-20 py-8 w-fit">
          <div className="bg-white p-4 rounded-lg shadow-[3px_4px_4px_0px_#00000040]">
            <Image
              src="/publish.png"
              alt="Store QR Code"
              width={140}
              height={140}
            />
          </div>

          {/* Visit Link */}
          <button className="mt-4 flex items-center justify-center gap-1 text-primary text-sm font-medium hover:underline w-full">
            Visit store URL
            <ExternalLink size={14} />
          </button>
        </div>

        {/* CTA */}
        <div className="mt-10 flex justify-center">
          <Button className="bg-primary hover:bg-red-800 px-23 py-3 rounded-[14px] text-base">
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}