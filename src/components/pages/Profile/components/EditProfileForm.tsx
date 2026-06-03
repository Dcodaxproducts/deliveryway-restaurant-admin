"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ComponentProps } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
    <Card className="w-full rounded-2xl border-none bg-white p-10 shadow-none">
      <form id={PROFILE_FORM_ID} className="space-y-10" noValidate onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col items-center">
          <div className="relative">
            <Avatar className="h-44 w-44 rounded-2xl shadow-md">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
              <AvatarFallback className="rounded-2xl text-4xl font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>

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
              className="absolute bottom-2 right-2 rounded-full border bg-white p-2 shadow hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Camera size={16} className="text-gray-700" />
            </button>

            {avatarUrl ? (
              <button
                type="button"
                aria-label={t("removePhoto")}
                onClick={clearAvatar}
                className="absolute bottom-2 left-2 rounded-full border bg-white p-2 shadow hover:bg-gray-50"
              >
                <Trash2 size={16} className="text-red-500" />
              </button>
            ) : null}
          </div>
          {uploading ? <p className="mt-2 text-xs text-gray-400">{t("uploadingImage")}</p> : null}

          <h2 className="mt-6 text-2xl font-semibold text-[#030401]">
            {displayName}
          </h2>

          <p className="text-sm text-[#909090]">{user?.email ?? "—"}</p>

          <p className="mt-3 max-w-lg text-center text-sm leading-relaxed text-[#909090]">
            {bio ?? t("noDescription")}
          </p>
        </div>

        <div className="mx-auto max-w-[80%] space-y-6 min-w-[70%]">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
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

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <FormInput
              id="profile-phone"
              label={t("phoneNumber")}
              placeholder={t("phonePlaceholder")}
              errorText={errors.phone?.message}
              {...register("phone")}
            />
            <div className="hidden md:block" />
          </div>

          <div>
            <label htmlFor="profile-bio" className={`mb-2 block ${LABEL_TEXT_CLASS}`}>
              {t("bio")}
            </label>
            <textarea
              id="profile-bio"
              placeholder={t("bioPlaceholder")}
              className="min-h-28 w-full rounded-[9px] border border-[#BBBBBB] px-3 py-2 text-sm outline-none focus:border-2 focus:border-primary"
              {...register("bio")}
            />
            {errors.bio?.message ? (
              <p className={`mt-1 ${FIELD_ERROR_CLASS}`}>{errors.bio.message}</p>
            ) : null}
          </div>

          <Button
            type="submit"
            disabled={saving || uploading}
            className="h-[46px] w-full rounded-xl bg-primary text-white hover:bg-red-600"
          >
            {saving ? common("saving") : t("saveProfile")}
          </Button>
        </div>
      </form>
    </Card>
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
        className="h-11 w-full rounded-[9px] border-[#BBBBBB] focus:border-2 focus:border-primary focus-visible:ring-0 focus:outline-none read-only:bg-gray-50"
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
