"use client";

import { FormSelect } from "@/components/ui/form-select";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Archive,
  Eye,
  Loader2,
  Mail,
  MessageSquareReply,
  RefreshCw,
} from "lucide-react";

import Container from "@/components/common/Container";
import EmptyState from "@/components/common/EmptyState";
import PageHeader from "@/components/common/PageHeader";
import PaginationSection from "@/components/common/PaginationSection";
import { FilterBar } from "@/components/common/FilterBar";
import type { DataTableColumn } from "@/components/common/DataTable";
import { ResponsiveDataView } from "@/components/common/ResponsiveDataView";
import { RowActions } from "@/components/common/RowActions";
import { SectionCard } from "@/components/common/SectionCard";
import { SearchField } from "@/components/common/SearchField";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
            <Input
              id="reply-subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Reply subject"
              className="h-10 rounded-[var(--ui-radius-control)]"
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
              placeholder="Write your reply"
              className="min-h-36 rounded-[var(--ui-radius-control)]"
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
              <p className="mb-2 text-sm font-semibold text-gray-900">
                Message
              </p>
              <p className="whitespace-pre-wrap break-words rounded-[16px] border border-gray-100 p-4 text-sm text-gray-600">
                {submission.message}
              </p>
            </div>

            {submission.replyMessage ? (
              <div>
                <p className="mb-2 text-sm font-semibold text-gray-900">
                  Reply
                </p>
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
  const [replySubmission, setReplySubmission] =
    useState<ContactSubmission | null>(null);
  const [detailSubmissionId, setDetailSubmissionId] = useState<
    string | undefined
  >();

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
      : undefined,
  );
  const branchOptions = useMemo(
    () => getBranchOptions(branchesQuery.data),
    [branchesQuery.data],
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
      nextStatus: ContactSubmissionStatusUpdateValue,
    ) => {
      await updateStatusMutation.mutateAsync({
        id: submission.id,
        payload: { status: nextStatus },
      });
    },
    [updateStatusMutation],
  );

  const handleLimitChange = (nextLimit: number) => {
    setLimit(nextLimit);
    setPage(1);
  };

  const columns: readonly DataTableColumn<ContactSubmission>[] = [
    {
      id: "customer",
      header: "Customer",
      className: "max-w-52",
      cell: (submission) => (
        <div>
          <p className="truncate font-semibold text-gray-900">
            {getCustomerLabel(submission)}
          </p>
          <p className="mt-1 truncate text-xs text-gray-500">
            {submission.email}
          </p>
        </div>
      ),
    },
    {
      id: "message",
      header: "Message",
      className: "max-w-72 whitespace-normal",
      cell: (submission) => (
        <div>
          <p className="truncate font-semibold text-gray-900">
            {submission.subject || "No subject"}
          </p>
          <p className="mt-1 line-clamp-2 break-words text-xs text-gray-500">
            {submission.message}
          </p>
        </div>
      ),
    },
    {
      id: "branch",
      header: "Branch",
      className: "max-w-44",
      cell: (submission) => (
        <span className="block truncate">{getBranchLabel(submission)}</span>
      ),
    },
    {
      id: "received",
      header: "Received",
      cell: (submission) =>
        submission.createdAt ? formatDateTime(submission.createdAt) : "—",
    },
    {
      id: "status",
      header: "Status",
      align: "center",
      cell: (submission) => (
        <ContactSubmissionStatusBadge status={submission.status} />
      ),
    },
    {
      id: "actions",
      header: "Actions",
      align: "center",
      cell: (submission) => (
        <RowActions
          label={`Actions for ${getCustomerLabel(submission)}`}
          actions={[
            {
              id: "view",
              label: "View details",
              icon: <Eye size={16} />,
              onSelect: () => setDetailSubmissionId(submission.id),
            },
            {
              id: "read",
              label: "Mark as read",
              icon: <Mail size={16} />,
              onSelect: () => updateStatus(submission, "READ"),
            },
            {
              id: "reply",
              label: "Reply",
              icon: <MessageSquareReply size={16} />,
              onSelect: () => setReplySubmission(submission),
            },
            {
              id: "archive",
              label: "Archive",
              icon: <Archive size={16} />,
              onSelect: () => updateStatus(submission, "ARCHIVED"),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <Container>
      <PageHeader
        title="Contact Submissions"
        description={
          isBranchAdmin
            ? "Manage customer contact requests for your assigned branch."
            : "Review, reply to, and archive customer contact requests."
        }
        actions={
          <Button
            type="button"
            variant="outline"
            onClick={() => submissionsQuery.refetch()}
            disabled={submissionsQuery.isFetching}
          >
            <RefreshCw
              aria-hidden="true"
              className={submissionsQuery.isFetching ? "animate-spin" : ""}
            />
            Refresh
          </Button>
        }
      />

      <SectionCard padding="md" className="space-y-6">
        <FilterBar
          resultCount={`${meta.total} submission${meta.total === 1 ? "" : "s"}`}
          search={
            <div className="min-w-0 lg:min-w-72">
              <Label
                htmlFor="contact-submission-search"
                className="mb-1.5 block text-xs font-medium text-[var(--ui-text-muted)]"
              >
                Search
              </Label>
              <SearchField
                id="contact-submission-search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onClear={() => setSearchInput("")}
                placeholder="Name, email, subject, or message"
              />
            </div>
          }
          filters={
            <>
              <div className="min-w-44 flex-1 sm:flex-none">
                <Label className="mb-1.5 block text-xs font-medium text-[var(--ui-text-muted)]">
                  Status
                </Label>
                <FormSelect
                  value={status}
                  onChange={(event) => {
                    setStatus(event.target.value);
                    setPage(1);
                  }}
                  className="h-10 rounded-[var(--ui-radius-control)] text-sm"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </FormSelect>
              </div>

              <div className="min-w-52 flex-1 sm:flex-none">
                <Label className="mb-1.5 block text-xs font-medium text-[var(--ui-text-muted)]">
                  Branch
                </Label>
                {isBranchAdmin ? (
                  <div className="flex h-10 items-center rounded-[var(--ui-radius-control)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-3 text-sm text-[var(--ui-text-muted)]">
                    {user?.branchName || branchId || "Assigned branch"}
                  </div>
                ) : (
                  <FormSelect
                    value={selectedBranchId}
                    onChange={(event) => {
                      setSelectedBranchId(event.target.value);
                      setPage(1);
                    }}
                    className="h-10 rounded-[var(--ui-radius-control)] text-sm"
                  >
                    <option value="">All branches</option>
                    {branchOptions.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </FormSelect>
                )}
              </div>
            </>
          }
          actions={
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
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
          }
        />

        <ResponsiveDataView
          data={submissions}
          columns={columns}
          rowKey={(submission) => submission.id}
          loading={submissionsQuery.isLoading}
          error={
            submissionsQuery.error
              ? submissionsQuery.error.message ||
                "Unable to load contact submissions"
              : undefined
          }
          errorTitle="Unable to load contact submissions"
          emptyTitle="No contact submissions found"
          emptyDescription="Customer messages from the public contact form will appear here."
          renderMobileItem={(submission) => (
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
          )}
        />

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
          <FormSelect
            value={String(limit)}
            onChange={(event) => handleLimitChange(Number(event.target.value))}
            className="h-10 w-[90px] rounded-[14px] border border-gray-200 px-3 text-sm"
          >
            {[10, 20, 50].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </FormSelect>
        </div>
      </SectionCard>

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
