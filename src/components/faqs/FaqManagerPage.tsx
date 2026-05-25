"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Plus,
  Star,
  Sparkles,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import Header from "@/components/header";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useDeleteFaq, useGetFaqList } from "@/hooks/useFaqs";
import DeleteDialog from "../dialogs/delete-dialog";

type ApiFAQStatus = "DRAFT" | "PUBLISHED";
type ApiFAQVisibility = "PUBLIC" | "PRIVATE";

type FAQItem = {
  id: string;
  question: string;
  answer: string;
  status: ApiFAQStatus;
  visibility: ApiFAQVisibility;
  category: string;
  createdAt: string;
  updatedAt: string;
};

type StatCardProps = {
  label: string;
  value: string;
  subText: string;
  subTextClassName?: string;
  rightContent?: React.ReactNode;
};

function StatCard({
  label,
  value,
  subText,
  subTextClassName = "text-[#12B76A]",
  rightContent,
}: StatCardProps) {
  return (
    <div className="relative min-h-[96px] rounded-2xl border border-[#ECEEF2] bg-white px-5 py-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#98A2B3]">
            {label}
          </p>

          <h3 className="mt-2 text-[28px] font-semibold leading-none text-[#1D2939]">
            {value}
          </h3>

          <p className={`mt-2 text-xs font-medium ${subTextClassName}`}>
            {subText}
          </p>
        </div>

        {rightContent && <div className="pt-4">{rightContent}</div>}
      </div>
    </div>
  );
}

const formatRelativeDate = (value?: string) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  }
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

  return date.toLocaleDateString();
};

function FAQRow({
  item,
  restaurantId,
  deletingFaqId,
  onDeleteClick,
}: {
  item: FAQItem;
  restaurantId: string;
  deletingFaqId: string | null;
  onDeleteClick: (item: FAQItem) => void;
}) {
  const isPublished = item.status === "PUBLISHED";
  const deleting = deletingFaqId === item.id;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#EAECF0] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition hover:shadow-[0_4px_12px_rgba(16,24,40,0.06)]">
      <div
        className={`absolute left-0 top-0 h-full w-1 ${
          isPublished ? "bg-[#12B76A]" : "bg-[#F5B301]"
        }`}
      />

      <div className="px-5 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-2.5 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-semibold uppercase leading-none ${
                  isPublished
                    ? "bg-[#ECFDF3] text-[#027A48]"
                    : "bg-[#FFF7E6] text-[#B54708]"
                }`}
              >
                {item.status}
              </span>

              <span
                className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-semibold uppercase leading-none ${
                  item.visibility === "PUBLIC"
                    ? "bg-blue-50 text-blue-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {item.visibility}
              </span>

              <span className="rounded-md bg-[#F8F9FB] px-2 py-1 text-[10px] font-semibold uppercase text-[#667085]">
                {item.category || "Uncategorized"}
              </span>

              <span className="text-xs text-[#98A2B3]">
                Updated {formatRelativeDate(item.updatedAt)}
              </span>
            </div>

            <h3 className="text-base font-semibold leading-6 text-[#101828] sm:text-[17px]">
              {item.question}
            </h3>

            <p className="mt-2 max-w-[900px] text-sm leading-6 text-[#667085]">
              {item.answer}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={`/faqs/add?id=${item.id}`}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#EAECF0] text-[#667085] transition hover:border-[#C1121F] hover:bg-[#FFF5F5] hover:text-[#C1121F]"
              title="Edit FAQ"
            >
              <Pencil size={16} />
            </Link>

            <button
              type="button"
              disabled={deleting || !restaurantId}
              onClick={() => onDeleteClick(item)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#EAECF0] text-[#667085] transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
              title="Delete FAQ"
            >
              {deleting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FAQManagerPage() {
  const { restaurantId, loading: authLoading } = useAuth();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [status, setStatus] = useState<"ALL" | ApiFAQStatus>("ALL");
  const [visibility, setVisibility] = useState<"ALL" | ApiFAQVisibility>("ALL");
  const [sortBy, setSortBy] = useState("Latest");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState<FAQItem | null>(null);
  const [deletingFaqId, setDeletingFaqId] = useState<string | null>(null);

  const {
    data: faqResponse,
    isLoading,
    isFetching,
  } = useGetFaqList(restaurantId || "");

  const { mutateAsync: deleteFaq } = useDeleteFaq();

  const faqData = faqResponse?.data;
  const faqs: FAQItem[] = faqData?.items || [];
  const categories: string[] = faqData?.categories || [];

  const loading = authLoading || isLoading || isFetching;

  const filteredFaqs = useMemo(() => {
    let items = [...faqs];

    const searchTerm = search.trim().toLowerCase();

    if (searchTerm) {
      items = items.filter((item) => {
        return (
          item.question?.toLowerCase().includes(searchTerm) ||
          item.answer?.toLowerCase().includes(searchTerm) ||
          item.category?.toLowerCase().includes(searchTerm)
        );
      });
    }

    if (category !== "All Categories") {
      items = items.filter((item) => item.category === category);
    }

    if (status !== "ALL") {
      items = items.filter((item) => item.status === status);
    }

    if (visibility !== "ALL") {
      items = items.filter((item) => item.visibility === visibility);
    }

    if (sortBy === "Oldest") {
      return items.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    }

    if (sortBy === "Published First") {
      return items.sort((a, b) =>
        a.status === b.status ? 0 : a.status === "PUBLISHED" ? -1 : 1
      );
    }

    return items.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [faqs, search, category, status, visibility, sortBy]);

  const totalFaqs = faqs.length;
  const publishedFaqs = faqs.filter(
    (item) => item.status === "PUBLISHED"
  ).length;
  const draftFaqs = faqs.filter((item) => item.status === "DRAFT").length;

  const handleDeleteClick = (item: FAQItem) => {
    setSelectedFaq(item);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!restaurantId || !selectedFaq?.id) return;

    try {
      setDeletingFaqId(selectedFaq.id);

      await deleteFaq({
        restaurantId,
        faqId: selectedFaq.id,
      });

      setDeleteDialogOpen(false);
      setSelectedFaq(null);
    } finally {
      setDeletingFaqId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <Header
            title="FAQ Manager"
            description="Manage your restaurant's frequently asked questions to help customers navigate ordering, payments, and policy information."
            titleClassName="text-[24px] sm:text-[28px] font-semibold text-[#101828] leading-tight"
            descriptionClassName="mt-1 max-w-[720px] text-sm text-[#667085] leading-6"
          />

          <Link
            href="/faqs/add"
            className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-full bg-[#C1121F] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#a50f1a]"
          >
            <Plus size={15} />
            <span>New FAQ Item</span>
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label="Total FAQs"
            value={loading ? "..." : String(totalFaqs)}
            subText={`${publishedFaqs} published`}
          />

          <StatCard
            label="Active Drafts"
            value={loading ? "..." : String(draftFaqs).padStart(2, "0")}
            subText="Needs review"
            subTextClassName="text-[#667085]"
          />

          <div className="relative min-h-[96px] overflow-hidden rounded-2xl border border-[#ECEEF2] bg-white px-5 py-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <div className="absolute -bottom-4 -right-3 opacity-[0.07]">
              <Sparkles size={96} className="text-[#C1121F]" strokeWidth={1.5} />
            </div>

            <div className="relative z-10">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#98A2B3]">
                Published FAQs
              </p>

              <div className="mt-2 flex items-center gap-2.5">
                <h3 className="text-[28px] font-semibold leading-none text-[#1D2939]">
                  {loading ? "..." : publishedFaqs}
                </h3>

                <div className="flex items-center gap-0.5 pt-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={13}
                      className="fill-[#D92D20] text-[#D92D20]"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 xl:flex-row">
          <div className="relative flex-1">
            <Search
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#98A2B3]"
            />

            <input
              type="text"
              placeholder="Filter by question or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 w-full rounded-xl border border-[#ECEEF2] bg-white pl-11 pr-4 text-sm text-[#101828] outline-none placeholder:text-[#98A2B3] focus:border-[#D0D5DD]"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-11 min-w-[160px] rounded-xl border border-[#ECEEF2] bg-white px-4 text-sm font-medium text-[#344054] outline-none focus:border-[#D0D5DD]"
            >
              <option value="All Categories">All Categories</option>

              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="h-11 min-w-[140px] rounded-xl border border-[#ECEEF2] bg-white px-4 text-sm font-medium text-[#344054] outline-none focus:border-[#D0D5DD]"
            >
              <option value="ALL">All Status</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
            </select>

            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as any)}
              className="h-11 min-w-[140px] rounded-xl border border-[#ECEEF2] bg-white px-4 text-sm font-medium text-[#344054] outline-none focus:border-[#D0D5DD]"
            >
              <option value="ALL">All Visibility</option>
              <option value="PUBLIC">Public</option>
              <option value="PRIVATE">Private</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-11 min-w-[140px] rounded-xl border border-[#ECEEF2] bg-white px-4 text-sm font-medium text-[#344054] outline-none focus:border-[#D0D5DD]"
            >
              <option>Latest</option>
              <option>Oldest</option>
              <option>Published First</option>
            </select>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {loading ? (
            <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-[#EAECF0] bg-white">
              <Loader2 className="animate-spin text-[#C1121F]" size={28} />
            </div>
          ) : filteredFaqs.length > 0 ? (
            filteredFaqs.map((item) => (
              <FAQRow
                key={item.id}
                item={item}
                restaurantId={restaurantId || ""}
                deletingFaqId={deletingFaqId}
                onDeleteClick={handleDeleteClick}
              />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-[#D0D5DD] bg-white px-6 py-12 text-center">
              <p className="text-base font-medium text-[#344054]">
                No FAQs found
              </p>

              <p className="mt-1 text-sm text-[#667085]">
                Try adjusting your search, status, visibility, or category
                filter.
              </p>
            </div>
          )}
        </div>
      </div>

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        isLoading={Boolean(deletingFaqId)}
        title="Delete FAQ"
        description={
          selectedFaq?.question
            ? `Are you sure you want to delete "${selectedFaq.question}"? This action cannot be undone.`
            : "Are you sure you want to delete this FAQ? This action cannot be undone."
        }
      />
    </div>
  );
}