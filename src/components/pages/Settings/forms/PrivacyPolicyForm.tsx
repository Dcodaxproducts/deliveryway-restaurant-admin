"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentType,
  type DragEvent,
  type ReactNode,
} from "react";
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
  ImageIcon,
  Italic,
  Link,
  List,
  ListOrdered,
  Loader2,
  MousePointerClick,
  Paintbrush,
  Pilcrow,
  RefreshCw,
  Redo2,
  RemoveFormatting,
  Save,
  ShieldCheck,
  Target,
  Type,
  Underline,
  Undo2,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";

import Header from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import {
  useCustomerAppContent,
  usePublicAboutUs,
  usePublicPrivacyPolicy,
  useUpdateCustomerAppAboutUs,
  useUpdateCustomerAppPrivacyPolicy,
} from "@/hooks/useCustomerAppContent";
import {
  buildAboutUsPageLink,
  buildPrivacyPolicyPageLink,
} from "@/services/customer-app-content";
import { useFileUpload } from "@/hooks/useFileUpload";
import { cn } from "@/lib/utils";

const emptyPolicyTemplate = `<h2>Privacy Policy</h2>
<p>Explain how your restaurant collects, uses, stores, and protects customer data.</p>

<h3>Information we collect</h3>
<p>Describe account, order, delivery, payment, and support information collected through the customer app.</p>

<h3>How we use information</h3>
<p>Explain order fulfillment, customer support, service improvement, and legal compliance uses.</p>

<h3>Contact</h3>
<p>Tell customers how to contact your restaurant about privacy questions.</p>`;

const emptyAboutUsTemplate = `<h2>About Us</h2>
<p>Share the story behind your restaurant, your cooking style, and what makes the customer experience special.</p>

<h3>Our food</h3>
<p>Describe your signature dishes, ingredients, sourcing, kitchen standards, or local favorites.</p>

<h3>Visit us</h3>
<p>Invite customers to order online, visit the restaurant, or follow your latest updates.</p>`;

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

const buildPreviewDocument = (content: string, emptyPreview: string) => {
  const safeContent = content.trim() || emptyPreview;

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

type ContentField = "privacyPolicy" | "aboutUs";

type CustomerAppContentPageProps = {
  translationKey: "privacyPolicy" | "aboutUs";
  contentField: ContentField;
  emptyTemplate: string;
  emptyPreview: string;
  buildPublicLink: () => string;
};

type AboutCardField = {
  title: string;
  description: string;
};

type AboutPageDraft = {
  hero: {
    imageUrl: string;
    title: string;
    subtitle: string;
    ctaLabel: string;
    ctaHref: string;
  };
  story: {
    imageUrl: string;
    badge: string;
    eyebrow: string;
    title: string;
    paragraphs: string;
  };
  missionVisionValues: AboutCardField[];
  whyChooseUs: AboutCardField[];
};

const aboutPageMarkerPrefix = "deliveryway-about-page:";

const defaultAboutPageDraft: AboutPageDraft = {
  hero: {
    imageUrl: "",
    title: "About Us",
    subtitle: "Fresh food, warm service, and a customer experience built around your table.",
    ctaLabel: "Order Now",
    ctaHref: "/",
  },
  story: {
    imageUrl: "",
    badge: "Established with passion",
    eyebrow: "Our Story",
    title: "Serving great food with care",
    paragraphs:
      "Share the story behind your restaurant, your cooking style, and what makes the customer experience special.\n\nDescribe your signature dishes, ingredients, sourcing, kitchen standards, or local favorites.",
  },
  missionVisionValues: [
    {
      title: "Mission",
      description: "Make every order simple, fresh, and memorable.",
    },
    {
      title: "Vision",
      description: "Become the neighborhood favorite for quality food and reliable service.",
    },
    {
      title: "Values",
      description: "Hospitality, consistency, transparency, and respect for every customer.",
    },
  ],
  whyChooseUs: [
    {
      title: "Easy ordering",
      description: "Customers can browse, customize, and place orders quickly.",
    },
    {
      title: "Fast delivery",
      description: "Prepared and delivered with speed, accuracy, and care.",
    },
    {
      title: "Quality food",
      description: "Fresh ingredients and kitchen standards customers can trust.",
    },
  ],
};

const encodeAboutDraft = (draft: AboutPageDraft) =>
  encodeURIComponent(JSON.stringify(draft));

const decodeAboutDraft = (value: string): AboutPageDraft | undefined => {
  const match = value.match(/<!--\s*deliveryway-about-page:([^]+?)\s*-->/);
  if (!match?.[1]) return undefined;

  try {
    return JSON.parse(decodeURIComponent(match[1])) as AboutPageDraft;
  } catch {
    return undefined;
  }
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const paragraphsToHtml = (value: string) =>
  value
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll("\n", "<br />")}</p>`)
    .join("\n");

const buildCardsHtml = (items: AboutCardField[]) =>
  items
    .filter((item) => item.title.trim() || item.description.trim())
    .map(
      (item) =>
        `<article><h3>${escapeHtml(item.title)}</h3>${paragraphsToHtml(item.description)}</article>`,
    )
    .join("\n");

const buildAboutPageHtml = (draft: AboutPageDraft) => `<!-- ${aboutPageMarkerPrefix}${encodeAboutDraft(draft)} -->
<section data-about-section="hero">
  ${draft.hero.imageUrl.trim() ? `<img src="${escapeHtml(draft.hero.imageUrl)}" alt="${escapeHtml(draft.hero.title)}" />` : ""}
  <h1>${escapeHtml(draft.hero.title)}</h1>
  ${paragraphsToHtml(draft.hero.subtitle)}
  <p><a href="${escapeHtml(draft.hero.ctaHref)}">${escapeHtml(draft.hero.ctaLabel)}</a></p>
</section>

<section data-about-section="story">
  ${draft.story.imageUrl.trim() ? `<img src="${escapeHtml(draft.story.imageUrl)}" alt="${escapeHtml(draft.story.title)}" />` : ""}
  ${draft.story.badge.trim() ? `<p><strong>${escapeHtml(draft.story.badge)}</strong></p>` : ""}
  ${draft.story.eyebrow.trim() ? `<p>${escapeHtml(draft.story.eyebrow)}</p>` : ""}
  <h2>${escapeHtml(draft.story.title)}</h2>
  ${paragraphsToHtml(draft.story.paragraphs)}
</section>

<section data-about-section="mission-vision-values">
  <h2>Mission / Vision / Values</h2>
  ${buildCardsHtml(draft.missionVisionValues)}
</section>

<section data-about-section="why-choose-us">
  <h2>Why Choose Us</h2>
  ${buildCardsHtml(draft.whyChooseUs)}
</section>`;

const stripHtmlToText = (value: string) =>
  value
    .replace(/<!--[^]*?-->/g, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]*>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const parseAboutPageDraft = (value: string) => {
  const decoded = decodeAboutDraft(value);
  if (decoded) return decoded;

  return {
    ...defaultAboutPageDraft,
    story: {
      ...defaultAboutPageDraft.story,
      paragraphs: stripHtmlToText(value) || defaultAboutPageDraft.story.paragraphs,
    },
  };
};

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

type AboutPageSectionEditorProps = {
  value: AboutPageDraft;
  onChange: (value: AboutPageDraft) => void;
};

type AboutDraftSection = keyof AboutPageDraft;

function AboutTextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-[#344054]">{label}</Label>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 rounded-xl border-[#D0D5DD] bg-white text-sm"
      />
    </div>
  );
}

function AboutTextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-[#344054]">{label}</Label>
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="min-h-0 resize-y rounded-xl border-[#D0D5DD] bg-white text-sm leading-6"
      />
    </div>
  );
}

function AboutImageUpload({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewObjectUrlRef = useRef<string | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { uploadFile, uploading } = useFileUpload();
  const previewSrc = localPreviewUrl || value.trim();
  const previewBackgroundImage = previewSrc ? `url(${JSON.stringify(previewSrc)})` : undefined;

  useEffect(() => {
    return () => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
      }
    };
  }, []);

  const clearLocalPreview = () => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }

    setLocalPreviewUrl(null);
  };

  const clearImage = () => {
    clearLocalPreview();
    onChange("");
  };

  const openFilePicker = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  const uploadSelectedFile = async (file?: File) => {
    if (!file || uploading) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file.");
      return;
    }

    clearLocalPreview();

    const objectUrl = URL.createObjectURL(file);
    previewObjectUrlRef.current = objectUrl;
    setLocalPreviewUrl(objectUrl);

    const syntheticEvent = {
      target: {
        files: [file],
      },
    } as unknown as ChangeEvent<HTMLInputElement>;

    const result = await uploadFile(syntheticEvent);
    if (result?.fileUrl) {
      onChange(result.fileUrl);
    } else {
      clearLocalPreview();
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!uploading) setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    await uploadSelectedFile(event.dataTransfer.files?.[0]);
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-[#344054]">{label}</Label>
      <div
        onClick={openFilePicker}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "group relative overflow-hidden rounded-xl border border-dashed bg-white transition-all duration-200",
          uploading ? "cursor-not-allowed opacity-80" : "cursor-pointer",
          isDragging
            ? "border-[#C1121F] bg-[#C1121F]/5 shadow-[0_0_0_4px_rgba(193,18,31,0.10)]"
            : "border-[#D0D5DD] hover:border-[#C1121F]/50 hover:bg-[#F8F9FB]",
        )}
      >
        {previewSrc ? (
          <div className="relative">
            <div
              role="img"
              aria-label={`${label} preview`}
              className="h-44 w-full bg-cover bg-center"
              style={{ backgroundImage: previewBackgroundImage }}
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent px-4 py-3">
              <p className="text-sm font-semibold text-white">Image selected</p>
              <p className="text-xs text-white/80">
                Drop another image here to replace it.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              onClick={(event) => {
                event.stopPropagation();
                clearImage();
              }}
              disabled={uploading}
              aria-label={`Clear ${label}`}
              className="absolute right-3 top-3 h-8 w-8 rounded-full bg-white/90 p-0 text-[#C1121F] shadow hover:bg-white"
            >
              <Trash2 className="size-4" />
            </Button>
            {uploading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
                <Loader2 className="size-6 animate-spin text-[#C1121F]" />
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex min-h-44 flex-col items-center justify-center px-5 py-7 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#C1121F]/5 text-[#C1121F] shadow-sm">
              {uploading ? (
                <Loader2 className="size-6 animate-spin" />
              ) : isDragging ? (
                <UploadCloud className="size-6" />
              ) : (
                <ImageIcon className="size-6" />
              )}
            </div>
            <p className="mt-4 text-sm font-semibold text-[#101828]">
              Drag & drop image here
            </p>
            <p className="mt-1 text-xs text-[#667085]">
              or <span className="font-medium text-[#C1121F]">click to browse</span>
            </p>
            <p className="mt-1 text-[11px] text-[#98A2B3]">PNG, JPG, WEBP</p>
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(event) => uploadSelectedFile(event.target.files?.[0])}
        className="sr-only"
      />
    </div>
  );
}

function AboutPageSectionEditor({ value, onChange }: AboutPageSectionEditorProps) {
  const updateObjectSection = <TSection extends AboutDraftSection,>(
    section: TSection,
    nextValue: AboutPageDraft[TSection],
  ) => {
    onChange({ ...value, [section]: nextValue });
  };

  const updateArrayItem = <TItem,>(
    section: "missionVisionValues" | "whyChooseUs",
    index: number,
    nextItem: TItem,
  ) => {
    onChange({
      ...value,
      [section]: value[section].map((item, itemIndex) =>
        itemIndex === index ? nextItem : item,
      ),
    });
  };

  return (
    <div className="space-y-4">
      <EditableSectionCard icon={ImageIcon} title="Hero / banner">
        <div className="grid gap-4 lg:grid-cols-2">
          <AboutImageUpload
            label="Hero image"
            value={value.hero.imageUrl}
            onChange={(imageUrl) => updateObjectSection("hero", { ...value.hero, imageUrl })}
          />
          <AboutTextInput
            label="Title"
            value={value.hero.title}
            onChange={(title) => updateObjectSection("hero", { ...value.hero, title })}
          />
          <AboutTextInput
            label="Subtitle"
            value={value.hero.subtitle}
            onChange={(subtitle) => updateObjectSection("hero", { ...value.hero, subtitle })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <AboutTextInput
              label="CTA label"
              value={value.hero.ctaLabel}
              onChange={(ctaLabel) => updateObjectSection("hero", { ...value.hero, ctaLabel })}
            />
            <AboutTextInput
              label="CTA link"
              value={value.hero.ctaHref}
              onChange={(ctaHref) => updateObjectSection("hero", { ...value.hero, ctaHref })}
            />
          </div>
        </div>
      </EditableSectionCard>

      <EditableSectionCard icon={FileText} title="Our Story">
        <div className="grid gap-4 lg:grid-cols-2">
          <AboutImageUpload
            label="Story image"
            value={value.story.imageUrl}
            onChange={(imageUrl) => updateObjectSection("story", { ...value.story, imageUrl })}
          />
          <AboutTextInput
            label="Badge"
            value={value.story.badge}
            onChange={(badge) => updateObjectSection("story", { ...value.story, badge })}
          />
          <AboutTextInput
            label="Eyebrow"
            value={value.story.eyebrow}
            onChange={(eyebrow) => updateObjectSection("story", { ...value.story, eyebrow })}
          />
          <AboutTextInput
            label="Title"
            value={value.story.title}
            onChange={(title) => updateObjectSection("story", { ...value.story, title })}
          />
        </div>
        <AboutTextArea
          label="Paragraphs"
          value={value.story.paragraphs}
          onChange={(paragraphs) => updateObjectSection("story", { ...value.story, paragraphs })}
          rows={6}
        />
      </EditableSectionCard>

      <EditableSectionCard icon={Target} title="Mission / Vision / Values">
        <div className="grid gap-4 lg:grid-cols-3">
          {value.missionVisionValues.map((item, index) => (
            <CardFields
              key={index}
              index={index}
              item={item}
              onChange={(nextItem) => updateArrayItem("missionVisionValues", index, nextItem)}
            />
          ))}
        </div>
      </EditableSectionCard>

      <EditableSectionCard icon={MousePointerClick} title="Why Choose Us">
        <div className="grid gap-4 lg:grid-cols-3">
          {value.whyChooseUs.map((item, index) => (
            <CardFields
              key={index}
              index={index}
              item={item}
              onChange={(nextItem) => updateArrayItem("whyChooseUs", index, nextItem)}
            />
          ))}
        </div>
      </EditableSectionCard>
    </div>
  );
}

function EditableSectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#EAECF0] bg-[#FCFCFD] p-4">
      <div className="mb-4 flex items-center gap-2">
        <span className="inline-flex size-9 items-center justify-center rounded-xl bg-white text-[#C1121F] shadow-sm">
          <Icon className="size-4" />
        </span>
        <h3 className="text-sm font-semibold text-[#101828]">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function CardFields({
  index,
  item,
  onChange,
}: {
  index: number;
  item: AboutCardField;
  onChange: (value: AboutCardField) => void;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-[#EAECF0] bg-white p-4">
      <AboutTextInput
        label={`Card ${index + 1} title`}
        value={item.title}
        onChange={(title) => onChange({ ...item, title })}
      />
      <AboutTextArea
        label="Description"
        value={item.description}
        onChange={(description) => onChange({ ...item, description })}
      />
    </div>
  );
}

export function AboutUsPage() {
  return (
    <CustomerAppContentPage
      translationKey="aboutUs"
      contentField="aboutUs"
      emptyTemplate={emptyAboutUsTemplate}
      emptyPreview="<p>No About Us content has been published yet.</p>"
      buildPublicLink={buildAboutUsPageLink}
    />
  );
}

export default function PrivacyPolicyPage() {
  return (
    <CustomerAppContentPage
      translationKey="privacyPolicy"
      contentField="privacyPolicy"
      emptyTemplate={emptyPolicyTemplate}
      emptyPreview="<p>No privacy policy content has been published yet.</p>"
      buildPublicLink={buildPrivacyPolicyPageLink}
    />
  );
}

function CustomerAppContentPage({
  translationKey,
  contentField,
  emptyTemplate,
  emptyPreview,
  buildPublicLink,
}: CustomerAppContentPageProps) {
  const t = useTranslations(translationKey);
  const commonT = useTranslations("common");
  const { restaurantId, loading: authLoading } = useAuth();
  const [draftContent, setDraftContent] = useState("");
  const [draftAboutPage, setDraftAboutPage] = useState<AboutPageDraft>(defaultAboutPageDraft);
  const [hasLoadedInitialContent, setHasLoadedInitialContent] = useState(false);

  const { data: content, isLoading, isFetching, refetch } = useCustomerAppContent(restaurantId);
  const { data: publicAboutUs } = usePublicAboutUs(restaurantId);
  const { data: publicPolicy } = usePublicPrivacyPolicy(restaurantId);
  const updateAboutUs = useUpdateCustomerAppAboutUs();
  const updatePrivacyPolicy = useUpdateCustomerAppPrivacyPolicy();

  const savedContent = content?.[contentField] ?? "";
  const publishedContent =
    contentField === "aboutUs"
      ? publicAboutUs?.aboutUs ?? ""
      : publicPolicy?.privacyPolicy ?? "";
  const publicLink = restaurantId ? buildPublicLink() : "";
  const isAboutUsPage = contentField === "aboutUs";
  const currentDraftContent = isAboutUsPage
    ? buildAboutPageHtml(draftAboutPage)
    : draftContent;
  const isDirty = currentDraftContent !== savedContent;
  const loading = authLoading || isLoading;
  const isSaving =
    contentField === "aboutUs" ? updateAboutUs.isPending : updatePrivacyPolicy.isPending;
  const previewDocument = useMemo(
    () => buildPreviewDocument(currentDraftContent, emptyPreview),
    [currentDraftContent, emptyPreview],
  );
  const wordCount = useMemo(() => countWords(stripHtmlToText(currentDraftContent)), [currentDraftContent]);
  const characterCount = currentDraftContent.length;
  const hasPublishedContent = publishedContent.trim().length > 0;

  useEffect(() => {
    if (hasLoadedInitialContent || isLoading) return;

    if (contentField === "aboutUs") {
      setDraftAboutPage(parseAboutPageDraft(savedContent || emptyTemplate));
    } else {
      setDraftContent(savedContent || emptyTemplate);
    }

    setHasLoadedInitialContent(true);
  }, [contentField, emptyTemplate, hasLoadedInitialContent, isLoading, savedContent]);

  const handleReset = () => {
    if (contentField === "aboutUs") {
      setDraftAboutPage(parseAboutPageDraft(savedContent || emptyTemplate));
      return;
    }

    setDraftContent(savedContent || emptyTemplate);
  };

  const handleSave = async () => {
    if (!restaurantId) {
      toast.error(t("missingRestaurant"));
      return;
    }

    const nextContent =
      contentField === "aboutUs"
        ? await updateAboutUs.mutateAsync({
            restaurantId,
            aboutUs: currentDraftContent.trim(),
          })
        : await updatePrivacyPolicy.mutateAsync({
            restaurantId,
            privacyPolicy: currentDraftContent.trim(),
          });

    if (contentField === "aboutUs") {
      setDraftAboutPage(parseAboutPageDraft(nextContent[contentField]));
    } else {
      setDraftContent(nextContent[contentField]);
    }

    setHasLoadedInitialContent(true);
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
                  {isAboutUsPage ? t("sectionEditor") : t("richEditor")}
                </span>
              </div>
            </div>

            <div className="p-5">
              {loading ? (
                <div className="flex min-h-[520px] items-center justify-center rounded-2xl border border-dashed border-[#D0D5DD] bg-[#FCFCFD]">
                  <Loader2 className="size-6 animate-spin text-[#98A2B3]" />
                </div>
              ) : isAboutUsPage ? (
                <AboutPageSectionEditor
                  value={draftAboutPage}
                  onChange={setDraftAboutPage}
                />
              ) : (
                <RichPolicyEditor
                  value={draftContent}
                  onChange={setDraftContent}
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
