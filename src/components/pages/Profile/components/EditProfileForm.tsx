"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Loader2, Save, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ComponentProps } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { SectionCard } from "@/components/common/SectionCard";
import { FormActions } from "@/components/common/FormLayout";
import { ProfileIdentityCard } from "@/components/pages/Profile/components/ProfileIdentityCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useFileUpload } from "@/hooks/useFileUpload";
import {
  getDisplayName,
  getInitials,
  getStoredAuth,
  saveStoredAuth,
} from "@/lib/auth";
import { FIELD_ERROR_CLASS, LABEL_TEXT_CLASS } from "@/components/common/common-classes";
import { getApiErrorMessage } from "@/lib/errors";
import { authApi, type UpdateProfilePayload } from "@/services/auth/auth.api";
import {
  profileSchema,
  type ProfileFormValues,
} from "@/validations/profile";

const PROFILE_FORM_ID = "profile-edit-form";

const defaultValues: ProfileFormValues = {
  firstName: "",
  lastName: "",
  avatarUrl: "",
  phone: "",
  bio: "",
};

export default function EditProfile() {
  const router = useRouter();
  const t = useTranslations("profile");
  const common = useTranslations("common");
  const { user, token, setUser } = useAuth();
  const { uploadFile, uploading } = useFileUpload();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewObjectUrlRef = useRef<string | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  const firstName = watch("firstName");
  const lastName = watch("lastName");
  const avatarUrlValue = watch("avatarUrl");
  const bio = watch("bio");

  useEffect(() => {
    const profile = user?.profile;

    reset({
      firstName: profile?.firstName ?? "",
      lastName: profile?.lastName ?? "",
      avatarUrl: profile?.avatarUrl ?? "",
      phone: profile?.phone ?? "",
      bio: profile?.bio ?? "",
    });
  }, [reset, user?.profile]);

  useEffect(() => {
    return () => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
      }
    };
  }, []);

  const displayName = useMemo(() => {
    const fullName = `${firstName ?? ""} ${lastName ?? ""}`.trim();
    return fullName || getDisplayName(user);
  }, [firstName, lastName, user]);

  const avatarUrl = avatarPreviewUrl ?? avatarUrlValue?.trim() ?? "";
  const initials = getInitials({
    ...(user ?? { id: "", email: "", role: "", profile: {} }),
    profile: {
      ...(user?.profile ?? {}),
      firstName,
      lastName,
    },
  });

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target;
    const file = files?.[0];

    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }

    if (file) {
      const objectUrl = URL.createObjectURL(file);
      previewObjectUrlRef.current = objectUrl;
      setAvatarPreviewUrl(objectUrl);
    }

    const result = await uploadFile(event);
    if (result?.fileUrl) {
      setValue("avatarUrl", result.fileUrl, { shouldDirty: true });
    }
  };

  const clearAvatar = () => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }

    setAvatarPreviewUrl(null);
    setValue("avatarUrl", "", { shouldDirty: true });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      setSaving(true);

      const payload: UpdateProfilePayload = {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        avatarUrl: values.avatarUrl?.trim() ?? "",
        phone: values.phone?.trim() ?? "",
        bio: values.bio?.trim() ?? "",
      };

      await authApi.updateProfile(payload);

      const stored = getStoredAuth();
      const nextUser = token ? await authApi.me(token, stored) : null;
      const mergedUser = nextUser ?? (user ? { ...user, profile: { ...user.profile, ...payload } } : null);

      if (mergedUser) {
        setUser(mergedUser);
        if (stored) {
          saveStoredAuth({ ...stored, user: mergedUser });
        }
      }

      toast.success(t("profileUpdated"));
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
        previewObjectUrlRef.current = null;
      }
      router.push("/profile");
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("updateProfileError")));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form id={PROFILE_FORM_ID} noValidate onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-4">
        <ProfileIdentityCard
          avatarUrl={avatarUrl}
          initials={initials}
          name={displayName}
          email={user?.email}
          description={bio || t("noDescription")}
          notice={uploading ? t("uploadingImage") : null}
          actions={
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFile}
                className="sr-only"
              />

              <button
                type="button"
                aria-label={avatarUrl ? t("changePhoto") : t("uploadPhoto")}
                onClick={openFilePicker}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 inline-flex size-8 items-center justify-center rounded-[var(--ui-radius-control)] border border-[var(--ui-border)] bg-[var(--ui-surface)] text-[var(--ui-text-muted)] shadow-[var(--ui-shadow-xs)] transition-colors hover:bg-[var(--ui-surface-subtle)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Camera aria-hidden="true" className="size-4" />
              </button>

              {avatarUrl ? (
                <button
                  type="button"
                  aria-label={t("removePhoto")}
                  onClick={clearAvatar}
                  className="absolute -bottom-1 -left-1 inline-flex size-8 items-center justify-center rounded-[var(--ui-radius-control)] border border-[var(--ui-border)] bg-[var(--ui-surface)] text-[var(--ui-danger)] shadow-[var(--ui-shadow-xs)] transition-colors hover:bg-[var(--ui-danger-soft)]"
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                </button>
              ) : null}
            </>
          }
        />

        <SectionCard
          padding="md"
          title={t("profileDetails")}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormInput
              id="profile-first-name"
              label={t("firstName")}
              placeholder={t("firstNamePlaceholder")}
              errorText={errors.firstName?.message}
              {...register("firstName")}
            />
            <FormInput
              id="profile-last-name"
              label={t("lastName")}
              placeholder={t("lastNamePlaceholder")}
              errorText={errors.lastName?.message}
              {...register("lastName")}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormInput
              id="profile-phone"
              label={t("phoneNumber")}
              placeholder={t("phonePlaceholder")}
              errorText={errors.phone?.message}
              {...register("phone")}
            />
          </div>

          <div>
            <label htmlFor="profile-bio" className={`mb-2 block ${LABEL_TEXT_CLASS}`}>
              {t("bio")}
            </label>
            <textarea
              id="profile-bio"
              placeholder={t("bioPlaceholder")}
              className="min-h-28 w-full rounded-[var(--ui-radius-control)] border border-[var(--ui-border-strong)] bg-[var(--ui-surface)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-[var(--ui-focus-ring)]/20"
              {...register("bio")}
            />
            {errors.bio?.message ? (
              <p className={`mt-1 ${FIELD_ERROR_CLASS}`}>{errors.bio.message}</p>
            ) : null}
          </div>

          <FormActions
            secondary={
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/profile")}
                disabled={saving}
              >
                <X aria-hidden="true" />
                {common("cancel")}
              </Button>
            }
            primary={
              <Button type="submit" disabled={saving || uploading}>
                {saving ? (
                  <Loader2 aria-hidden="true" className="animate-spin" />
                ) : (
                  <Save aria-hidden="true" />
                )}
                {saving ? common("saving") : common("save")}
              </Button>
            }
          />
        </SectionCard>
      </div>
    </form>
  );
}

function FormInput({
  id,
  label,
  placeholder,
  errorText,
  onChange,
  ...props
}: ComponentProps<typeof Input> & {
  id: string;
  label: string;
  errorText?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className={`mb-2 block ${LABEL_TEXT_CLASS}`}>
        {label}
      </label>

      <Input
        id={id}
        placeholder={placeholder}
        aria-invalid={Boolean(errorText)}
        aria-describedby={errorText ? `${id}-error` : undefined}
        className="h-10 w-full rounded-[var(--ui-radius-control)] border-[var(--ui-border-strong)] bg-[var(--ui-surface)] text-sm focus:border-primary focus-visible:ring-[var(--ui-focus-ring)]/20 read-only:bg-[var(--ui-surface-subtle)]"
        {...props}
        onChange={(event) => {
          const { target } = event;
          onChange?.(event);
          void target;
        }}
      />
      {errorText ? (
        <p id={`${id}-error`} className={`mt-1 ${FIELD_ERROR_CLASS}`}>
          {errorText}
        </p>
      ) : null}
    </div>
  );
}
