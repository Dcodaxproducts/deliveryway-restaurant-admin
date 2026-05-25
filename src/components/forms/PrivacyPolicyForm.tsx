"use client";

import { useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  Link as LinkIcon,
  Image as ImageIcon,
  RotateCcw,
  ArrowRight,
} from "lucide-react";
import Header from "@/components/header";

export default function PrivacyPolicyPage() {
  const [title] = useState("Privacy Policy");
  const [status] = useState("Draft Mode");
  const [heading] = useState("Heading 1");

  return (
    <div className="min-h-screen bg-[#F8F9FB] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.9fr_0.8fr]">
          {/* Left Section */}
          <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <Header
                title={title}
                description="Last modified by Sarah Chen, 2 days ago"
                titleClassName="text-[24px] sm:text-[28px] font-semibold text-[#101828] leading-tight"
                descriptionClassName="mt-1 text-sm text-[#667085] leading-6"
              />

              <div className="inline-flex h-8 items-center rounded-full bg-[#E6F4FA] px-3 text-xs font-semibold text-[#1D7FA8]">
                {status}
              </div>
            </div>

            {/* Editor */}
            <div className="overflow-hidden rounded-3xl border border-[#EAECF0] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-1 border-b border-[#EAECF0] px-4 py-3">
                {[
                  Bold,
                  Italic,
                  Underline,
                  AlignLeft,
                  AlignCenter,
                  AlignRight,
                  List,
                  LinkIcon,
                  ImageIcon,
                ].map((Icon, index) => (
                  <button
                    key={index}
                    type="button"
                    className="inline-flex size-8 items-center justify-center rounded-lg text-[#667085] transition hover:bg-[#F9FAFB] hover:text-[#344054]"
                  >
                    <Icon size={15} />
                  </button>
                ))}

                <div className="ml-2 h-5 w-px bg-[#E4E7EC]" />

                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm text-[#667085] transition hover:bg-[#F9FAFB] hover:text-[#344054]"
                >
                  <span>{heading}</span>
                  <span className="text-xs">▼</span>
                </button>
              </div>

              {/* Editor Content */}
              <div className="px-6 py-7 sm:px-8">
                <div className="max-w-[760px] space-y-6 text-[#344054]">
                  <div>
                    <h2 className="text-[18px] font-semibold text-[#101828]">
                      Culinary Curator Privacy Policy
                    </h2>
                    <p className="mt-3 text-sm text-[#667085]">
                      Effective Date: October 24, 2023
                    </p>
                  </div>

                  <p className="text-[15px] leading-7">
                    At Culinary Curator, we value the trust you place in us when
                    sharing your personal data. This Privacy Policy describes how we
                    collect, use, and share your information when you use our
                    restaurant portal and related services.
                  </p>

                  <div>
                    <h3 className="text-[16px] font-semibold text-[#101828]">
                      1. Information We Collect
                    </h3>
                    <p className="mt-3 text-[15px] leading-7">
                      We collect information that you provide directly to us, such
                      as when you create an account, update your restaurant profile,
                      or contact customer support. This may include:
                    </p>

                    <ul className="mt-4 space-y-2 pl-6 text-[15px] leading-7 text-[#344054]">
                      <li>Business name and contact details</li>
                      <li>Account credentials (username and password)</li>
                      <li>Financial information for billing and payments</li>
                      <li>Content you upload to the portal</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-[16px] font-semibold text-[#101828]">
                      2. How We Use Information
                    </h3>
                    <p className="mt-3 text-[15px] leading-7">
                      We use the information we collect to provide, maintain, and
                      improve our services, to process your transactions, and to
                      communicate with you about updates and promotions.
                    </p>
                  </div>

                  <div className="rounded-2xl border-l-4 border-[#F0A7A1] bg-[#FFF7F7] px-5 py-4">
                    <p className="text-[15px] italic leading-7 text-[#475467]">
                      “Our commitment to privacy means we never sell your
                      restaurant&apos;s proprietary data to third-party marketing
                      firms.”
                    </p>
                  </div>

                  <div>
                    <h3 className="text-[16px] font-semibold text-[#101828]">
                      3. Data Security
                    </h3>
                    <p className="mt-3 text-[15px] leading-7">
                      We implement appropriate technical and organizational measures
                      to protect your personal data against unauthorized or unlawful
                      processing and against accidental loss, destruction, or
                      damage.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="flex flex-col gap-3 rounded-2xl border border-[#EAECF0] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  <div className="flex size-8 items-center justify-center rounded-full border-2 border-white bg-[#101828] text-xs font-semibold text-white">
                    S
                  </div>
                  <div className="flex size-8 items-center justify-center rounded-full border-2 border-white bg-[#F2F4F7] text-[10px] font-semibold text-[#344054]">
                    +2
                  </div>
                </div>

                <p className="text-sm text-[#667085]">
                  Currently viewing:{" "}
                  <span className="font-semibold text-[#344054]">Sarah Chen</span>{" "}
                  and 2 others
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="inline-flex h-10 items-center justify-center rounded-full bg-[#F2F4F7] px-5 text-sm font-semibold text-[#344054] transition hover:bg-[#E4E7EC]"
                >
                  Save as Draft
                </button>

                <button
                  type="button"
                  className="inline-flex h-10 items-center justify-center rounded-full bg-[#D92D20] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#b42318]"
                >
                  Publish Changes
                </button>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="rounded-3xl border border-[#EAECF0] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <div className="flex items-center gap-2">
              <RotateCcw size={16} className="text-[#98A2B3]" />
              <h3 className="text-sm font-semibold text-[#101828]">
                Version History
              </h3>
            </div>

            <div className="mt-5 space-y-4">
              {/* Current */}
              <div className="rounded-2xl border border-[#F3D6D8] bg-[#FFF7F7] p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-[#1F2937] text-sm font-semibold text-white">
                    S
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-[#101828]">
                          Sarah Chen
                        </p>
                        <p className="text-xs text-[#98A2B3]">Today, 2:45 PM</p>
                      </div>

                      <span className="inline-flex rounded-full bg-[#D92D20] px-2 py-0.5 text-[9px] font-bold uppercase text-white">
                        Current
                      </span>
                    </div>

                    <p className="mt-2 text-sm leading-6 text-[#667085]">
                      Updated data security section to comply with new GDPR
                      mandates.
                    </p>
                  </div>
                </div>
              </div>

              {/* Older */}
              <div className="rounded-2xl p-2">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-[#F2F4F7] text-xs font-semibold text-[#667085]">
                    🤖
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#101828]">
                      System Bot
                    </p>
                    <p className="text-xs text-[#98A2B3]">Aug 01, 12:00 AM</p>
                    <p className="mt-2 text-sm leading-6 text-[#667085]">
                      Automated archival of previous year&apos;s policy.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex min-h-[420px] items-end justify-center">
              <button
                type="button"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#667085] transition hover:text-[#344054]"
              >
                <span>View All History</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}