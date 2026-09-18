"use client";

import { useMemo, useState } from "react";
import {
  FileCheck2,
  FileClock,
  HelpCircle,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";

import PageLayout from "@/components/common/Container";
import { FilterBar } from "@/components/common/FilterBar";
import PageHeader from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { StatePanel } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/status-badge";
import PromotionStatCard from "@/components/cards/PromotionStatCard";
import DeleteDialog from "@/components/common/dialogs/delete-dialog";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/form-select";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useDeleteFaq, useGetFaqList } from "@/hooks/useFaqs";

type ApiFAQStatus = "DRAFT" | "PUBLISHED";
type ApiFAQVisibility = "PUBLIC" | "PRIVATE";
type FAQStatusFilter = "ALL" | ApiFAQStatus;
type FAQVisibilityFilter = "ALL" | ApiFAQVisibility;

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

const isStatusFilter = (value: string): value is FAQStatusFilter =>
  value === "ALL" || value === "DRAFT" || value === "PUBLISHED";

const isVisibilityFilter = (value: string): value is FAQVisibilityFilter =>
  value === "ALL" || value === "PUBLIC" || value === "PRIVATE";

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
    <article className="rounded-[var(--ui-radius-card)] border border-[var(--ui-border)] bg-[var(--ui-surface)] transition duration-[var(--ui-motion-normal)] hover:border-[var(--ui-border-strong)]">
      <div className="p-3.5 sm:px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <StatusBadge tone={isPublished ? "success" : "warning"} size="sm">
                {item.status}
              </StatusBadge>
              <StatusBadge
                tone={item.visibility === "PUBLIC" ? "info" : "neutral"}
                size="sm"
              >
                {item.visibility}
              </StatusBadge>
              <StatusBadge size="sm">
                {item.category || "Uncategorized"}
              </StatusBadge>
              <span className="text-xs text-[var(--ui-text-subtle)]">
                Updated {formatRelativeDate(item.updatedAt)}
              </span>
            </div>

            <h3 className="text-sm font-semibold leading-5 text-[var(--ui-text)]">
              {item.question}
            </h3>

            <p className="mt-1 line-clamp-2 max-w-[900px] text-xs leading-5 text-[var(--ui-text-muted)] sm:text-sm">
              {item.answer}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Button asChild variant="outline" size="icon-sm">
              <Link href={`/faqs/add?id=${item.id}`} title="Edit FAQ">
                <Pencil aria-hidden="true" />
                <span className="sr-only">Edit FAQ</span>
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={deleting || !restaurantId}
              onClick={() => onDeleteClick(item)}
              className="text-[var(--ui-text-muted)] hover:border-[var(--ui-danger)] hover:bg-[var(--ui-danger-soft)] hover:text-[var(--ui-danger)]"
              title="Delete FAQ"
            >
              {deleting ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Trash2 aria-hidden="true" />
              )}
              <span className="sr-only">Delete FAQ</span>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function FAQManagerPage() {
  const { restaurantId, loading: authLoading } = useAuth();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [status, setStatus] = useState<FAQStatusFilter>("ALL");
  const [visibility, setVisibility] = useState<FAQVisibilityFilter>("ALL");
  const [sortBy, setSortBy] = useState("Latest");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState<FAQItem | null>(null);
  const [deletingFaqId, setDeletingFaqId] = useState<string | null>(null);

  const {
    data: faqResponse,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetFaqList(restaurantId || "");

  const { mutateAsync: deleteFaq } = useDeleteFaq();

  const faqData = faqResponse?.data as
    { items?: FAQItem[]; categories?: string[] } | undefined;
  const faqs = useMemo(() => faqData?.items ?? [], [faqData?.items]);
  const categories = faqData?.categories ?? [];

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
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    }

    if (sortBy === "Published First") {
      return items.sort((a, b) =>
        a.status === b.status ? 0 : a.status === "PUBLISHED" ? -1 : 1,
      );
    }

    return items.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, [faqs, search, category, status, visibility, sortBy]);

  const totalFaqs = faqs.length;
  const publishedFaqs = faqs.filter(
    (item) => item.status === "PUBLISHED",
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
    <PageLayout>
      <PageHeader
        title="FAQ Manager"
        description="Manage the answers customers see for ordering, payments, and restaurant policies."
        actions={
          <Button asChild>
            <Link href="/faqs/add">
              <Plus aria-hidden="true" />
              New FAQ
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <PromotionStatCard
          icon={<HelpCircle aria-hidden="true" className="size-4" />}
          value={totalFaqs}
          label="Total FAQs"
          loading={loading}
        />
        <PromotionStatCard
          icon={<FileCheck2 aria-hidden="true" className="size-4" />}
          value={publishedFaqs}
          label="Published"
          loading={loading}
        />
        <PromotionStatCard
          icon={<FileClock aria-hidden="true" className="size-4" />}
          value={draftFaqs}
          label="Drafts"
          loading={loading}
        />
      </div>

      <SectionCard padding="md" className="space-y-5">
        <FilterBar
          search={
            <div className="relative flex-1">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--ui-text-subtle)]"
              />
              <Input
                type="text"
                placeholder="Filter by question or keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 bg-[var(--ui-surface)] pl-9 text-sm"
              />
            </div>
          }
          filters={
            <>
              <FormSelect
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                aria-label="Filter FAQs by category"
                className="h-10 w-full min-w-[150px] rounded-[var(--ui-radius-control)] bg-[var(--ui-surface)] sm:w-auto"
              >
                <option value="All Categories">All Categories</option>

                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </FormSelect>

              <FormSelect
                value={status}
                onChange={(event) => {
                  if (isStatusFilter(event.target.value)) {
                    setStatus(event.target.value);
                  }
                }}
                aria-label="Filter FAQs by status"
                className="h-10 w-full min-w-[130px] rounded-[var(--ui-radius-control)] bg-[var(--ui-surface)] sm:w-auto"
              >
                <option value="ALL">All Status</option>
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
              </FormSelect>

              <FormSelect
                value={visibility}
                onChange={(event) => {
                  if (isVisibilityFilter(event.target.value)) {
                    setVisibility(event.target.value);
                  }
                }}
                aria-label="Filter FAQs by visibility"
                className="h-10 w-full min-w-[140px] rounded-[var(--ui-radius-control)] bg-[var(--ui-surface)] sm:w-auto"
              >
                <option value="ALL">All Visibility</option>
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
              </FormSelect>

              <FormSelect
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort FAQs"
                className="h-10 w-full min-w-[130px] rounded-[var(--ui-radius-control)] bg-[var(--ui-surface)] sm:w-auto"
              >
                <option>Latest</option>
                <option>Oldest</option>
                <option>Published First</option>
              </FormSelect>
            </>
          }
        />

        <div className="space-y-3">
          {!restaurantId && !authLoading ? (
            <StatePanel
              state="unavailable"
              title="Select a restaurant"
              description="Choose a restaurant to manage its customer FAQs."
            />
          ) : isError ? (
            <StatePanel
              state="error"
              title="FAQs could not be loaded"
              description="Try again to refresh the FAQ list."
              action={
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void refetch()}
                >
                  Try again
                </Button>
              }
            />
          ) : loading ? (
            <StatePanel
              state="loading"
              title="Loading FAQs"
              description="Fetching the latest questions and publishing status."
            />
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
            <StatePanel
              state="empty"
              title="No FAQs found"
              description="Adjust the filters or create an FAQ to help customers find answers."
              action={
                <Button asChild variant="outline">
                  <Link href="/faqs/add">Create FAQ</Link>
                </Button>
              }
            />
          )}
        </div>
      </SectionCard>

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
    </PageLayout>
  );
}
