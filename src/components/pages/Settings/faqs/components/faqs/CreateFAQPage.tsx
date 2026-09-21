"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  Bold,
  Image as ImageIcon,
  Italic,
  Lightbulb,
  Link as LinkIcon,
  List,
  Loader2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import Container from "@/components/common/Container";
import { StatePanel } from "@/components/common/EmptyState";
import { FormField } from "@/components/common/FormField";
import {
  FormActions,
  FormLayout,
  FormSection,
} from "@/components/common/FormLayout";
import PageHeader from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/form-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useCreateFaq, useGetFaq, useUpdateFaq } from "@/hooks/useFaqs";

type VisibilityUI = "all" | "logged-in";

type FAQFormValues = {
  question: string;
  category: string;
  answer: string;
  status: boolean;
  visibility: VisibilityUI;
};

const defaultFaqFormValues: FAQFormValues = {
  question: "",
  category: "",
  answer: "",
  status: false,
  visibility: "all",
};

const editorTools = [
  { icon: Bold, label: "bold" },
  { icon: Italic, label: "italic" },
  { icon: List, label: "list" },
  { icon: LinkIcon, label: "link" },
  { icon: ImageIcon, label: "image" },
] as const;

export default function CreateFAQPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("faqs");
  const commonT = useTranslations("common");
  const feedback = useTranslations("common.feedback");
  const { user } = useAuth();
  const faqId = searchParams.get("id");
  const isEditMode = Boolean(faqId);
  const restaurantId = useMemo(() => user?.restaurantId || "", [user]);
  const { data: faqData, isLoading: isFaqLoading } = useGetFaq(
    restaurantId,
    faqId || "",
  );
  const createFaqMutation = useCreateFaq();
  const updateFaqMutation = useUpdateFaq();
  const { control, register, reset, setValue } = useForm<FAQFormValues>({
    defaultValues: defaultFaqFormValues,
    mode: "onChange",
  });
  const [initialized, setInitialized] = useState(false);
  const {
    question = "",
    category = "",
    answer = "",
    status = false,
    visibility = "all",
  } = useWatch({ control });

  useEffect(() => {
    if (!isEditMode) {
      setInitialized(true);
      return;
    }

    if (!faqData || initialized) return;

    reset({
      question: faqData.question || "",
      category: faqData.category || "",
      answer: faqData.answer || "",
      status: faqData.status === "PUBLISHED",
      visibility: faqData.visibility === "PRIVATE" ? "logged-in" : "all",
    });
    setInitialized(true);
  }, [faqData, initialized, isEditMode, reset]);

  const isSubmitting =
    createFaqMutation.isPending || updateFaqMutation.isPending;
  const payload = {
    question: question.trim(),
    category: category.trim(),
    answer: answer.trim(),
    status: status ? ("PUBLISHED" as const) : ("DRAFT" as const),
    visibility:
      visibility === "logged-in" ? ("PRIVATE" as const) : ("PUBLIC" as const),
  };
  const isFormValid =
    Boolean(restaurantId) &&
    payload.question.length >= 3 &&
    Boolean(payload.category) &&
    payload.answer.length >= 3;

  const saveFaq = async (publishOverride: boolean) => {
    if (!restaurantId) return;

    const finalPayload = {
      ...payload,
      status: publishOverride ? ("PUBLISHED" as const) : payload.status,
    };

    try {
      if (isEditMode && faqId) {
        await updateFaqMutation.mutateAsync({
          restaurantId,
          faqId,
          payload: finalPayload,
        });
      } else {
        await createFaqMutation.mutateAsync({
          restaurantId,
          payload: finalPayload,
        });
      }

      router.push("/faqs");
    } catch {
      // Mutation hooks own translated error feedback.
    }
  };

  if (isEditMode && isFaqLoading && !initialized) {
    return (
      <Container>
        <PageHeader title={t("managerTitle")} description={t("loadingDetail")} />
        <StatePanel
          state="loading"
          title={t("loadingDetail")}
          description={feedback("loadingDescription")}
        />
      </Container>
    );
  }

  return (
    <Container>
      <PageHeader
        title={isEditMode ? t("editTitle") : t("addTitle")}
        description={t("managerDescription")}
      />

      <FormLayout
        aside={
          <div className="space-y-5">
            <FormSection
              title={t("previewTitle")}
              description={t("previewDescription")}
            >
              <div className="rounded-[var(--ui-radius-card)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] p-4">
                <p className="text-sm font-semibold text-[var(--ui-text)]">
                  {question.trim() || t("previewPlaceholder")}
                </p>
                {answer.trim() ? (
                  <p className="mt-2 line-clamp-4 text-sm leading-5 text-[var(--ui-text-muted)]">
                    {answer}
                  </p>
                ) : null}
              </div>
            </FormSection>

            <FormSection title={t("publishingTitle")}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label htmlFor="faq-status">{commonT("status")}</Label>
                  <div className="mt-2">
                    <StatusBadge tone={status ? "success" : "neutral"}>
                      {status ? t("published") : t("draft")}
                    </StatusBadge>
                  </div>
                </div>
                <Switch
                  id="faq-status"
                  checked={status}
                  onCheckedChange={(checked) =>
                    setValue("status", checked, { shouldDirty: true })
                  }
                  aria-label={t("statusToggle")}
                />
              </div>

              <FormField id="faq-visibility" label={t("visibility")}>
                <RadioGroup
                  id="faq-visibility"
                  value={visibility}
                  onValueChange={(value) =>
                    setValue("visibility", value as VisibilityUI, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  className="gap-3"
                >
                  {(["all", "logged-in"] as const).map((option) => (
                    <Label
                      key={option}
                      htmlFor={`faq-visibility-${option}`}
                      className="flex cursor-pointer items-start gap-3 rounded-[var(--ui-radius-card)] border border-[var(--ui-border)] p-3"
                    >
                      <RadioGroupItem
                        id={`faq-visibility-${option}`}
                        value={option}
                        className="size-5"
                      />
                      <span>
                        <span className="block text-sm font-medium text-[var(--ui-text)]">
                          {option === "all"
                            ? t("visibleToAll")
                            : t("loggedInOnly")}
                        </span>
                        <span className="mt-1 block text-xs font-normal text-[var(--ui-text-muted)]">
                          {option === "all"
                            ? t("visibleToAllDescription")
                            : t("loggedInOnlyDescription")}
                        </span>
                      </span>
                    </Label>
                  ))}
                </RadioGroup>
              </FormField>
            </FormSection>

            <FormSection title={t("editorialTipTitle")}>
              <div className="flex items-start gap-3 text-sm leading-6 text-[var(--ui-text-muted)]">
                <Lightbulb aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
                <p>{t("editorialTipDescription")}</p>
              </div>
            </FormSection>
          </div>
        }
        actions={
          <FormActions
            sticky
            secondary={
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => router.push("/faqs")}
                >
                  {commonT("cancel")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!isFormValid || isSubmitting}
                  onClick={() => saveFaq(false)}
                >
                  {isEditMode ? t("saveChanges") : t("saveDraft")}
                </Button>
              </div>
            }
            primary={
              <Button
                type="button"
                disabled={!isFormValid || isSubmitting}
                onClick={() => saveFaq(true)}
              >
                {isSubmitting ? (
                  <Loader2 aria-hidden="true" className="animate-spin" />
                ) : null}
                {isSubmitting
                  ? commonT("saving")
                  : isEditMode
                    ? t("updateFaq")
                    : t("publishFaq")}
              </Button>
            }
          />
        }
      >
        <FormSection
          title={t("contentTitle")}
          description={t("contentDescription")}
        >
          <FormField id="faq-question" label={t("question")} required>
            <Input
              id="faq-question"
              placeholder={t("questionPlaceholder")}
              {...register("question")}
            />
          </FormField>

          <FormField id="faq-category" label={t("category")} required>
            <FormSelect id="faq-category" {...register("category")}>
              <option value="">{t("selectCategory")}</option>
              <option value="Orders">{t("categories.orders")}</option>
              <option value="Delivery">{t("categories.delivery")}</option>
              <option value="Payments">{t("categories.payments")}</option>
              <option value="Policy">{t("categories.policy")}</option>
            </FormSelect>
          </FormField>

          <FormField id="faq-answer" label={t("answer")} required>
            <div className="overflow-hidden rounded-[var(--ui-radius-control)] border border-[var(--ui-border)]">
              <div
                className="flex items-center gap-1 border-b border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-2 py-1.5"
                role="toolbar"
                aria-label={t("editorToolbar")}
              >
                {editorTools.map(({ icon: Icon, label }) => (
                  <Button
                    key={label}
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    title={t(`editorTools.${label}`)}
                    aria-label={t(`editorTools.${label}`)}
                  >
                    <Icon aria-hidden="true" />
                  </Button>
                ))}
              </div>
              <Textarea
                id="faq-answer"
                placeholder={t("answerPlaceholder")}
                className="min-h-56 resize-y rounded-none border-0 shadow-none focus-visible:ring-0"
                {...register("answer")}
              />
            </div>
          </FormField>
        </FormSection>
      </FormLayout>
    </Container>
  );
}
