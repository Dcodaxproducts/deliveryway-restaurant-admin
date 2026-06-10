"use client";

import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { useTranslations } from "next-intl";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  CheckCircle2,
  Copy,
  Eye,
  FileText,
  Globe2,
  Heading2,
  Heading3,
  Italic,
  Link,
  List,
  ListOrdered,
  Loader2,
  Paintbrush,
  Pilcrow,
  RefreshCw,
  Redo2,
  RemoveFormatting,
  Save,
  ShieldCheck,
  Type,
  Underline,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";

import Header from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  useCustomerAppContent,
  usePublicPrivacyPolicy,
  useUpdateCustomerAppPrivacyPolicy,
} from "@/hooks/useCustomerAppContent";
import { buildPrivacyPolicyPageLink } from "@/services/customer-app-content";
import { cn } from "@/lib/utils";

const emptyPolicyTemplate = `<h2>Privacy Policy</h2>
<p>Explain how your restaurant collects, uses, stores, and protects customer data.</p>

<h3>Information we collect</h3>
<p>Describe account, order, delivery, payment, and support information collected through the customer app.</p>

<h3>How we use information</h3>
<p>Explain order fulfillment, customer support, service improvement, and legal compliance uses.</p>

<h3>Contact</h3>
<p>Tell customers how to contact your restaurant about privacy questions.</p>`;

type EditorCommand =
  | { type: "command"; command: string; value?: string }
  | { type: "block"; value: "p" | "h2" | "h3" };

type EditorButton = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  action: EditorCommand;
};

const editorButtonGroups: EditorButton[][] = [
  [
    { label: "Paragraph", icon: Pilcrow, action: { type: "block", value: "p" } },
    { label: "Heading 2", icon: Heading2, action: { type: "block", value: "h2" } },
    { label: "Heading 3", icon: Heading3, action: { type: "block", value: "h3" } },
  ],
  [
    { label: "Bold", icon: Bold, action: { type: "command", command: "bold" } },
    { label: "Italic", icon: Italic, action: { type: "command", command: "italic" } },
    { label: "Underline", icon: Underline, action: { type: "command", command: "underline" } },
  ],
  [
    { label: "Bulleted list", icon: List, action: { type: "command", command: "insertUnorderedList" } },
    {
      label: "Numbered list",
      icon: ListOrdered,
      action: { type: "command", command: "insertOrderedList" },
    },
  ],
  [
    { label: "Align left", icon: AlignLeft, action: { type: "command", command: "justifyLeft" } },
    { label: "Align center", icon: AlignCenter, action: { type: "command", command: "justifyCenter" } },
    { label: "Align right", icon: AlignRight, action: { type: "command", command: "justifyRight" } },
  ],
  [
    { label: "Undo", icon: Undo2, action: { type: "command", command: "undo" } },
    { label: "Redo", icon: Redo2, action: { type: "command", command: "redo" } },
    {
      label: "Clear formatting",
      icon: RemoveFormatting,
      action: { type: "command", command: "removeFormat" },
    },
  ],
];

const editorSwatches = ["#101828", "#475467", "#C1121F", "#1D7FA8", "#027A48", "#B54708"];

const buildPreviewDocument = (content: string) => {
  const safeContent = content.trim() || "<p>No privacy policy content has been published yet.</p>";

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      :root { color-scheme: light; }
      body {
        margin: 0;
        color: #1d2939;
        background: #ffffff;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      main { padding: 24px; }
      h1, h2, h3 { color: #101828; line-height: 1.25; margin: 0 0 12px; }
      h1 { font-size: 28px; }
      h2 { font-size: 22px; margin-top: 24px; }
      h3 { font-size: 18px; margin-top: 22px; }
      p, li { font-size: 14px; line-height: 1.75; color: #475467; }
      p { margin: 0 0 14px; }
      ul, ol { padding-left: 22px; margin: 0 0 16px; }
      strong, b { color: #101828; }
      a { color: #c1121f; font-weight: 600; }
    </style>
  </head>
  <body>
    <main>${safeContent}</main>
  </body>
</html>`;
};

const countWords = (value: string) => value.trim().split(/\s+/).filter(Boolean).length;

function RichPolicyEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const latestExternalValue = useRef("");
  const [linkUrl, setLinkUrl] = useState("");

  useEffect(() => {
    if (!editorRef.current || latestExternalValue.current === value) return;

    editorRef.current.innerHTML = value;
    latestExternalValue.current = value;
  }, [value]);

  const syncEditorValue = () => {
    const nextValue = editorRef.current?.innerHTML ?? "";
    latestExternalValue.current = nextValue;
    onChange(nextValue);
  };

  const runCommand = (action: EditorCommand) => {
    editorRef.current?.focus();

    if (action.type === "block") {
      document.execCommand("formatBlock", false, action.value);
    } else {
      document.execCommand(action.command, false, action.value);
    }

    syncEditorValue();
  };

  const insertLink = () => {
    const url = linkUrl.trim();
    if (!url) return;

    runCommand({ type: "command", command: "createLink", value: url });
    setLinkUrl("");
  };

  return (
    <div className="overflow-hidden rounded-[24px] border border-[#D0D5DD] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
      <div className="flex flex-wrap items-center gap-2 border-b border-[#EAECF0] bg-[#FCFCFD] px-3 py-3">
        {editorButtonGroups.map((group, groupIndex) => (
          <div
            key={groupIndex}
            className="flex items-center gap-1 rounded-full border border-[#EAECF0] bg-white p-1"
          >
            {group.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => runCommand(item.action)}
                  className="inline-flex size-9 items-center justify-center rounded-full text-[#475467] transition hover:bg-[#F2F4F7] hover:text-[#101828] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C1121F]"
                  title={item.label}
                  aria-label={item.label}
                >
                  <Icon className="size-4" />
                </button>
              );
            })}
          </div>
        ))}

        <div className="flex items-center gap-1 rounded-full border border-[#EAECF0] bg-white p-1">
          {editorSwatches.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => runCommand({ type: "command", command: "foreColor", value: color })}
              className="size-9 rounded-full p-2 transition hover:bg-[#F2F4F7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C1121F]"
              title={`Text color ${color}`}
              aria-label={`Text color ${color}`}
            >
              <span className="block size-full rounded-full border border-black/10" style={{ backgroundColor: color }} />
            </button>
          ))}
        </div>

        <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-[#EAECF0] bg-white px-3 text-sm font-semibold text-[#475467] transition hover:bg-[#F2F4F7]">
          <Type className="size-4" />
          <input
            type="color"
            className="size-6 cursor-pointer rounded border-0 bg-transparent p-0"
            onChange={(event) =>
              runCommand({ type: "command", command: "foreColor", value: event.target.value })
            }
            aria-label="Custom text color"
          />
        </label>

        <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-[#EAECF0] bg-white px-3 text-sm font-semibold text-[#475467] transition hover:bg-[#F2F4F7]">
          <Paintbrush className="size-4" />
          <input
            type="color"
            className="size-6 cursor-pointer rounded border-0 bg-transparent p-0"
            onChange={(event) =>
              runCommand({ type: "command", command: "hiliteColor", value: event.target.value })
            }
            aria-label="Highlight color"
          />
        </label>

        <div className="flex h-11 min-w-0 items-center gap-1 rounded-full border border-[#EAECF0] bg-white px-2">
          <Link className="ml-1 size-4 shrink-0 text-[#98A2B3]" />
          <input
            value={linkUrl}
            onChange={(event) => setLinkUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                insertLink();
              }
            }}
            placeholder="Paste link"
            className="h-9 w-28 min-w-0 bg-transparent text-sm text-[#475467] outline-none placeholder:text-[#98A2B3] sm:w-40"
            aria-label="Policy link URL"
          />
          <button
            type="button"
            onClick={insertLink}
            disabled={!linkUrl.trim()}
            className="inline-flex h-8 items-center rounded-full bg-[#101828] px-3 text-xs font-semibold text-white transition hover:bg-[#344054] disabled:cursor-not-allowed disabled:bg-[#D0D5DD]"
          >
            Add
          </button>
        </div>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label={placeholder}
        onInput={syncEditorValue}
        onBlur={syncEditorValue}
        data-placeholder={placeholder}
        className="prose-editor min-h-[560px] w-full overflow-auto bg-white px-6 py-5 text-sm leading-7 text-[#344054] outline-none empty:before:pointer-events-none empty:before:text-[#98A2B3] empty:before:content-[attr(data-placeholder)] [&_a]:font-semibold [&_a]:text-[#C1121F] [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:leading-tight [&_h2]:text-[#101828] [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-[#101828] [&_li]:my-1 [&_ol]:my-4 [&_ol]:pl-6 [&_p]:mb-4 [&_strong]:text-[#101828] [&_ul]:my-4 [&_ul]:pl-6"
      />
    </div>
  );
}

export default function PrivacyPolicyPage() {
  const t = useTranslations("privacyPolicy");
  const commonT = useTranslations("common");
  const { restaurantId, loading: authLoading } = useAuth();
  const [draftPolicy, setDraftPolicy] = useState("");
  const [hasLoadedInitialPolicy, setHasLoadedInitialPolicy] = useState(false);

  const { data: content, isLoading, isFetching, refetch } = useCustomerAppContent(restaurantId);
  const { data: publicPolicy } = usePublicPrivacyPolicy(restaurantId);
  const { mutateAsync: updatePrivacyPolicy, isPending: isSaving } =
    useUpdateCustomerAppPrivacyPolicy();

  const savedPolicy = content?.privacyPolicy ?? "";
  const publicContent = publicPolicy?.privacyPolicy ?? "";
  const publicLink = restaurantId ? buildPrivacyPolicyPageLink() : "";
  const isDirty = draftPolicy !== savedPolicy;
  const loading = authLoading || isLoading;
  const previewDocument = useMemo(() => buildPreviewDocument(draftPolicy), [draftPolicy]);
  const wordCount = useMemo(() => countWords(draftPolicy), [draftPolicy]);
  const characterCount = draftPolicy.length;
  const hasPublishedContent = publicContent.trim().length > 0;

  useEffect(() => {
    if (hasLoadedInitialPolicy || isLoading) return;

    setDraftPolicy(savedPolicy || emptyPolicyTemplate);
    setHasLoadedInitialPolicy(true);
  }, [hasLoadedInitialPolicy, isLoading, savedPolicy]);

  const handleReset = () => {
    setDraftPolicy(savedPolicy || emptyPolicyTemplate);
  };

  const handleSave = async () => {
    if (!restaurantId) {
      toast.error(t("missingRestaurant"));
      return;
    }

    const nextContent = await updatePrivacyPolicy({
      restaurantId,
      privacyPolicy: draftPolicy.trim(),
    });
    setDraftPolicy(nextContent.privacyPolicy);
    setHasLoadedInitialPolicy(true);
  };

  const handleCopyPublicLink = async () => {
    if (!publicLink) return;

    await navigator.clipboard.writeText(publicLink);
    toast.success(t("linkCopied"));
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px] space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <Header
            title={t("title")}
            description={t("description")}
            titleClassName="text-[24px] sm:text-[30px] font-semibold text-[#101828] leading-tight"
            descriptionClassName="mt-1 max-w-3xl text-sm text-[#667085] leading-6"
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => refetch()}
              disabled={loading || isFetching}
              className="h-10 rounded-full border-[#D0D5DD] bg-white text-[#344054]"
            >
              {isFetching ? <Loader2 className="animate-spin" /> : <RefreshCw />}
              {commonT("refresh")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={loading || isSaving || !isDirty}
              className="h-10 rounded-full border-[#D0D5DD] bg-white text-[#344054]"
            >
              {commonT("reset")}
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={loading || isSaving || !restaurantId || !isDirty}
              className="h-10 rounded-full bg-[#C1121F] px-5 text-white hover:bg-[#A30F1A]"
            >
              {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
              {isSaving ? commonT("saving") : commonT("save")}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[#EAECF0] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase text-[#98A2B3]">
                  {t("status")}
                </p>
                <p className="mt-2 text-xl font-semibold text-[#101828]">
                  {isDirty ? t("unsaved") : t("synced")}
                </p>
              </div>
              <ShieldCheck className={cn("size-5", isDirty ? "text-[#F79009]" : "text-[#12B76A]")} />
            </div>
          </div>

          <div className="rounded-2xl border border-[#EAECF0] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <p className="text-[11px] font-semibold uppercase text-[#98A2B3]">
              {t("coverage")}
            </p>
            <p className="mt-2 text-xl font-semibold text-[#101828]">
              {wordCount.toLocaleString()} {t("words")}
            </p>
            <p className="mt-1 text-xs text-[#667085]">
              {characterCount.toLocaleString()} {t("characters")}
            </p>
          </div>

          <div className="rounded-2xl border border-[#EAECF0] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase text-[#98A2B3]">
                  {t("publicPopup")}
                </p>
                <p className="mt-2 text-xl font-semibold text-[#101828]">
                  {hasPublishedContent ? t("available") : t("notPublished")}
                </p>
              </div>
              <Globe2 className="size-5 text-[#1D7FA8]" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="overflow-hidden rounded-3xl border border-[#EAECF0] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <div className="border-b border-[#EAECF0] px-5 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 text-[#C1121F]" />
                    <h2 className="text-base font-semibold text-[#101828]">
                      {t("editorTitle")}
                    </h2>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-[#667085]">
                    {t("editorDescription")}
                  </p>
                </div>

                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#F8F9FB] px-3 py-1 text-xs font-semibold text-[#475467]">
                  <FileText className="size-3.5" />
                  {t("richEditor")}
                </span>
              </div>
            </div>

            <div className="p-5">
              {loading ? (
                <div className="flex min-h-[520px] items-center justify-center rounded-2xl border border-dashed border-[#D0D5DD] bg-[#FCFCFD]">
                  <Loader2 className="size-6 animate-spin text-[#98A2B3]" />
                </div>
              ) : (
                <RichPolicyEditor
                  value={draftPolicy}
                  onChange={setDraftPolicy}
                  placeholder={t("placeholder")}
                />
              )}
            </div>
          </section>

          <aside className="space-y-5">
            <section className="overflow-hidden rounded-3xl border border-[#EAECF0] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
              <div className="border-b border-[#EAECF0] px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Eye className="size-4 text-[#1D7FA8]" />
                      <h2 className="text-base font-semibold text-[#101828]">
                        {t("previewTitle")}
                      </h2>
                    </div>
                    <p className="mt-1 text-sm text-[#667085]">{t("previewDescription")}</p>
                  </div>

                  {isDirty ? (
                    <span className="rounded-full bg-[#FFF7E6] px-3 py-1 text-xs font-semibold text-[#B54708]">
                      {t("draft")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#ECFDF3] px-3 py-1 text-xs font-semibold text-[#027A48]">
                      <CheckCircle2 className="size-3.5" />
                      {t("live")}
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-[#F8F9FB] p-4">
                <div className="overflow-hidden rounded-[24px] border border-[#EAECF0] bg-white shadow-sm">
                  <div className="border-b border-[#EAECF0] px-5 py-4">
                    <p className="text-sm font-semibold text-[#101828]">{t("modalTitle")}</p>
                    <p className="mt-1 text-xs text-[#667085]">{t("modalSubtitle")}</p>
                  </div>
                  <iframe
                    title={t("previewTitle")}
                    sandbox=""
                    srcDoc={previewDocument}
                    className="h-[460px] w-full bg-white"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-[#EAECF0] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-[#101828]">
                    {t("publicPageTitle")}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-[#667085]">
                    {t("publicPageDescription")}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-[#EAECF0] bg-[#F8F9FB] p-3">
                <code className="block break-all text-xs leading-5 text-[#475467]">
                  {publicLink || t("missingRestaurant")}
                </code>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleCopyPublicLink}
                disabled={!publicLink}
                className="mt-4 h-10 w-full rounded-full border-[#D0D5DD] bg-white text-[#344054]"
              >
                <Copy />
                {t("copyLink")}
              </Button>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
