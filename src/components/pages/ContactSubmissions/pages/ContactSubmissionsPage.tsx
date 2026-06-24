"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Archive,
  Eye,
  Loader2,
  Mail,
  MessageSquareReply,
  MoreHorizontal,
  RefreshCw,
  Search,
} from "lucide-react";

import Container from "@/components/common/Container";
import EmptyState from "@/components/common/EmptyState";
import PageHeader from "@/components/common/PageHeader";
import PaginationSection from "@/components/common/pagination";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useGetBranches } from "@/hooks/useBranches";
import {
  useContactSubmission,
  useContactSubmissions,
  useReplyToContactSubmission,
  useUpdateContactSubmissionStatus,
} from "@/hooks/useContactSubmissions";
import { formatDateTime } from "@/components/pages/TableReservations/utils/table-reservations-formatters";
import type {
  ContactSubmission,
  ContactSubmissionStatusUpdateValue,
} from "@/types/contact-submissions";

type BranchOption = {
  id: string;
  name: string;
};

const statusOptions = [
  { label: "All statuses", value: "ALL" },
  { label: "New", value: "NEW" },
  { label: "Read", value: "READ" },
  { label: "Replied", value: "REPLIED" },
  { label: "Archived", value: "ARCHIVED" },
];

const statusToneMap: Record<string, "success" | "warning" | "info" | "neutral"> = {
  NEW: "warning",
  READ: "info",
  REPLIED: "success",
  ARCHIVED: "neutral",
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const getBranchOptions = (payload: unknown): BranchOption[] => {
  const source = isRecord(payload) ? payload.data : payload;
  if (!Array.isArray(source)) return [];

  return source.reduce<BranchOption[]>((options, item) => {
    if (!isRecord(item) || typeof item.id !== "string") return options;

    options.push({
      id: item.id,
      name: typeof item.name === "string" && item.name ? item.name : item.id,
    });

    return options;
  }, []);
};

const getBranchLabel = (submission: ContactSubmission) => {
  return submission.branch?.name || submission.branchId || "All branches";
};

const getCustomerLabel = (submission: ContactSubmission) => {
  return submission.name || submission.email || "Customer";
};

function ContactSubmissionStatusBadge({ status }: { status: string }) {
  return (
    <StatusBadge tone={statusToneMap[status] ?? "neutral"}>
      {status.replace(/_/g, " ")}
    </StatusBadge>
  );
}

function ContactSubmissionReplyDialog({
  submission,
  open,
  onOpenChange,
}: {
  submission: ContactSubmission | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const replyMutation = useReplyToContactSubmission();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!submission || !open) return;

    setSubject(`Re: ${submission.subject || "Your message"}`);
    setMessage("");
  }, [open, submission]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!submission || !subject.trim() || !message.trim()) return;

    await replyMutation.mutateAsync({
      id: submission.id,
      payload: {
        subject: subject.trim(),
        message: message.trim(),
      },
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[560px] rounded-[20px] p-6">
        <DialogHeader>
          <DialogTitle>Reply to customer</DialogTitle>
          <DialogDescription>
            This sends an email reply and marks the submission as replied.
          </DialogDescription>
        </DialogHeader>

        {submission ? (
          <div className="rounded-[16px] bg-gray-50 p-4 text-sm text-gray-600">
            <p className="font-semibold text-gray-900">{getCustomerLabel(submission)}</p>
            <p className="mt-1 break-words">{submission.email}</p>
            <p className="mt-3 break-words text-gray-700">{submission.message}</p>
          </div>
        ) : null}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="reply-subject">Subject</Label>
            <input
              id="reply-subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="h-11 w-full rounded-[14px] border border-gray-200 px-4 text-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
              maxLength={160}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reply-message">Message</Label>
            <Textarea
              id="reply-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="min-h-36 rounded-[14px]"
              maxLength={4000}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={replyMutation.isPending || !subject.trim() || !message.trim()}
            >
              {replyMutation.isPending ? "Sending..." : "Send reply"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ContactSubmissionDetailDialog({
  submissionId,
  open,
  onOpenChange,
}: {
  submissionId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const submissionQuery = useContactSubmission(submissionId);
  const submission = submissionQuery.data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[620px] rounded-[20px] p-6">
        <DialogHeader>
          <DialogTitle>Contact submission</DialogTitle>
          <DialogDescription>
            Customer message, routing scope, and reply status.
          </DialogDescription>
        </DialogHeader>

        {submissionQuery.isLoading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" />
            Loading submission...
          </div>
        ) : submission ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  {submission.subject || "No subject"}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {submission.createdAt ? formatDateTime(submission.createdAt) : ""}
                </p>
              </div>
              <ContactSubmissionStatusBadge status={submission.status} />
            </div>

            <div className="grid gap-3 rounded-[16px] bg-gray-50 p-4 text-sm md:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase text-gray-400">Customer</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {getCustomerLabel(submission)}
                </p>
                <p className="break-words text-gray-500">{submission.email}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-gray-400">Branch</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {getBranchLabel(submission)}
                </p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-gray-900">Message</p>
              <p className="whitespace-pre-wrap break-words rounded-[16px] border border-gray-100 p-4 text-sm text-gray-600">
                {submission.message}
              </p>
            </div>

            {submission.replyMessage ? (
              <div>
                <p className="mb-2 text-sm font-semibold text-gray-900">Reply</p>
                <div className="rounded-[16px] border border-green-100 bg-green-50 p-4 text-sm text-green-800">
                  <p className="font-semibold">{submission.replySubject}</p>
                  <p className="mt-2 whitespace-pre-wrap break-words">
                    {submission.replyMessage}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <EmptyState
            title="Submission unavailable"
            description="The selected submission could not be loaded."
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function ContactSubmissionsPage() {
  const { restaurantId, branchId, isBranchAdmin, user } = useAuth();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [replySubmission, setReplySubmission] = useState<ContactSubmission | null>(null);
  const [detailSubmissionId, setDetailSubmissionId] = useState<string | undefined>();

  const scopedBranchId = isBranchAdmin
    ? branchId || undefined
    : selectedBranchId || undefined;

  const branchesQuery = useGetBranches(
    restaurantId && !isBranchAdmin
      ? {
          restaurantId,
          includeInactive: false,
          sortOrder: "ASC",
        }
      : undefined
  );
  const branchOptions = useMemo(
    () => getBranchOptions(branchesQuery.data),
    [branchesQuery.data]
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  const submissionsQuery = useContactSubmissions({
    page,
    limit,
    restaurantId: restaurantId || undefined,
    branchId: scopedBranchId,
    status: status !== "ALL" ? status : undefined,
    search: search || undefined,
  });
  const updateStatusMutation = useUpdateContactSubmissionStatus();

  const submissions = submissionsQuery.data?.submissions ?? [];
  const meta = submissionsQuery.data?.meta ?? {
    page,
    limit,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
  };

  const updateStatus = useCallback(
    async (
      submission: ContactSubmission,
      nextStatus: ContactSubmissionStatusUpdateValue
    ) => {
      await updateStatusMutation.mutateAsync({
        id: submission.id,
        payload: { status: nextStatus },
      });
    },
    [updateStatusMutation]
  );

  const handleLimitChange = (nextLimit: number) => {
    setLimit(nextLimit);
    setPage(1);
  };

  return (
    <Container>
      <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <PageHeader
            title="Contact Submissions"
            description={
              isBranchAdmin
                ? "Manage customer contact requests for your assigned branch."
                : "Review, reply to, and archive customer contact requests."
            }
          />
          <p className="text-sm text-gray-500">
            {meta.total} submission{meta.total === 1 ? "" : "s"} found
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => submissionsQuery.refetch()}
          disabled={submissionsQuery.isFetching}
          className="w-fit items-center gap-2"
        >
          <RefreshCw
            size={18}
            className={submissionsQuery.isFetching ? "animate-spin" : ""}
          />
          Refresh
        </Button>
      </div>

      <div className="mt-6 space-y-6 rounded-lg bg-white p-4 shadow-sm lg:p-6">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-12 xl:items-end">
          <div className="xl:col-span-4">
            <Label className="mb-1.5 block text-xs font-medium text-gray-600">
              Search
            </Label>
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search name, email, subject, or message"
                className="h-[44px] w-full rounded-[14px] border border-gray-200 bg-[#FAFAFA] pl-11 pr-4 text-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
              />
            </div>
          </div>

          <div className="xl:col-span-2">
            <Label className="mb-1.5 block text-xs font-medium text-gray-600">
              Status
            </Label>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className="h-[44px] w-full rounded-[14px] border border-gray-200 bg-[#FAFAFA] px-4 text-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="xl:col-span-3">
            <Label className="mb-1.5 block text-xs font-medium text-gray-600">
              Branch
            </Label>
            {isBranchAdmin ? (
              <div className="flex h-[44px] items-center rounded-[14px] border border-gray-200 bg-gray-50 px-4 text-sm text-gray-600">
                {user?.branchName || branchId || "Assigned branch"}
              </div>
            ) : (
              <select
                value={selectedBranchId}
                onChange={(event) => {
                  setSelectedBranchId(event.target.value);
                  setPage(1);
                }}
                className="h-[44px] w-full rounded-[14px] border border-gray-200 bg-[#FAFAFA] px-4 text-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
              >
                <option value="">All branches</option>
                {branchOptions.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="xl:col-span-3">
            <Button
              type="button"
              variant="outline"
              className="h-[44px] w-full"
              onClick={() => {
                setSearchInput("");
                setSearch("");
                setStatus("ALL");
                setSelectedBranchId("");
                setPage(1);
              }}
            >
              Clear filters
            </Button>
          </div>
        </div>

        {submissionsQuery.isLoading ? (
          <div className="py-10 text-center text-sm text-gray-400">
            Loading contact submissions...
          </div>
        ) : submissionsQuery.error ? (
          <EmptyState
            title="Unable to load contact submissions"
            description={submissionsQuery.error.message}
          />
        ) : submissions.length === 0 ? (
          <EmptyState
            title="No contact submissions found"
            description="Customer messages from the public contact form will appear here."
          />
        ) : (
          <div className="overflow-hidden rounded-[18px] border border-gray-100">
            <div className="hidden md:block">
              <table className="w-full table-fixed text-sm">
                <thead>
                  <tr className="border-b bg-[#FAFAFA] text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="w-[22%] px-5 py-4">Customer</th>
                    <th className="w-[28%] px-3 py-4">Message</th>
                    <th className="w-[16%] px-3 py-4">Branch</th>
                    <th className="w-[14%] px-3 py-4">Received</th>
                    <th className="w-[12%] px-3 py-4 text-center">Status</th>
                    <th className="w-[8%] px-5 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission) => (
                    <tr
                      key={submission.id}
                      className="border-b border-gray-100 transition hover:bg-[#FAFAFA]"
                    >
                      <td className="px-5 py-4">
                        <p className="truncate font-semibold text-gray-900">
                          {getCustomerLabel(submission)}
                        </p>
                        <p className="mt-1 truncate text-xs text-gray-500">
                          {submission.email}
                        </p>
                      </td>
                      <td className="px-3 py-4">
                        <p className="truncate font-semibold text-gray-900">
                          {submission.subject || "No subject"}
                        </p>
                        <p className="mt-1 line-clamp-2 break-words text-xs text-gray-500">
                          {submission.message}
                        </p>
                      </td>
                      <td className="px-3 py-4 text-gray-700">
                        <span className="block truncate">
                          {getBranchLabel(submission)}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-gray-500">
                        {submission.createdAt ? formatDateTime(submission.createdAt) : "—"}
                      </td>
                      <td className="px-3 py-4 text-center">
                        <ContactSubmissionStatusBadge status={submission.status} />
                      </td>
                      <td className="px-5 py-4 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex size-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-50 hover:text-primary"
                            >
                              <MoreHorizontal size={18} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() => setDetailSubmissionId(submission.id)}
                            >
                              <Eye size={16} />
                              View details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => updateStatus(submission, "READ")}
                            >
                              <Mail size={16} />
                              Mark as read
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setReplySubmission(submission)}
                            >
                              <MessageSquareReply size={16} />
                              Reply
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => updateStatus(submission, "ARCHIVED")}
                            >
                              <Archive size={16} />
                              Archive
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 p-3 md:hidden">
              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  className="rounded-[16px] border border-gray-100 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900">
                        {submission.subject || "No subject"}
                      </p>
                      <p className="mt-1 truncate text-xs text-gray-500">
                        {getCustomerLabel(submission)} · {submission.email}
                      </p>
                    </div>
                    <ContactSubmissionStatusBadge status={submission.status} />
                  </div>
                  <p className="mt-3 line-clamp-3 text-sm text-gray-600">
                    {submission.message}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setDetailSubmissionId(submission.id)}
                    >
                      View
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setReplySubmission(submission)}
                    >
                      Reply
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <PaginationSection
            page={meta.page}
            totalPages={meta.totalPages}
            total={meta.total}
            limit={meta.limit}
            hasNext={meta.hasNext}
            hasPrevious={meta.hasPrevious}
            onPageChange={setPage}
          />
          <select
            value={String(limit)}
            onChange={(event) => handleLimitChange(Number(event.target.value))}
            className="h-10 w-[90px] rounded-[14px] border border-gray-200 px-3 text-sm"
          >
            {[10, 20, 50].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ContactSubmissionReplyDialog
        submission={replySubmission}
        open={Boolean(replySubmission)}
        onOpenChange={(open) => {
          if (!open) setReplySubmission(null);
        }}
      />
      <ContactSubmissionDetailDialog
        submissionId={detailSubmissionId}
        open={Boolean(detailSubmissionId)}
        onOpenChange={(open) => {
          if (!open) setDetailSubmissionId(undefined);
        }}
      />
    </Container>
  );
}
