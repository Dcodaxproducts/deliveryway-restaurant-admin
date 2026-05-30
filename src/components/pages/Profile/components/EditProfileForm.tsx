"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
import { getApiErrorMessage } from "@/lib/errors";
import { authApi, type UpdateProfilePayload } from "@/services/auth/auth.api";

const PROFILE_FORM_ID = "profile-edit-form";

type ProfileFormState = UpdateProfilePayload;

const getInitialFormState = (): ProfileFormState => ({
  firstName: "",
  lastName: "",
  avatarUrl: "",
  phone: "",
  bio: "",
});

export default function EditProfile() {
  const router = useRouter();
  const { user, token, setUser } = useAuth();
  const { uploadFile, uploading } = useFileUpload();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [values, setValues] = useState<ProfileFormState>(getInitialFormState);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const profile = user?.profile;

    setValues({
      firstName: profile?.firstName ?? "",
      lastName: profile?.lastName ?? "",
      avatarUrl: profile?.avatarUrl ?? "",
      phone: profile?.phone ?? "",
      bio: profile?.bio ?? "",
    });
  }, [user]);

  const displayName = useMemo(() => {
    const fullName = `${values.firstName} ${values.lastName}`.trim();
    return fullName || getDisplayName(user);
  }, [user, values.firstName, values.lastName]);

  const avatarUrl = values.avatarUrl.trim();
  const initials = getInitials({
    ...(user ?? { id: "", email: "", role: "", profile: {} }),
    profile: {
      ...(user?.profile ?? {}),
      firstName: values.firstName,
      lastName: values.lastName,
    },
  });

  const updateValue = (field: keyof ProfileFormState, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const result = await uploadFile(event);
    if (result?.fileUrl) {
      updateValue("avatarUrl", result.fileUrl);
    }
  };

  const clearAvatar = () => {
    updateValue("avatarUrl", "");
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!values.firstName.trim() || !values.lastName.trim()) {
      toast.error("First name and last name are required");
      return;
    }

    try {
      setSaving(true);

      const payload: UpdateProfilePayload = {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        avatarUrl: values.avatarUrl.trim(),
        phone: values.phone.trim(),
        bio: values.bio.trim(),
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

      toast.success("Profile updated successfully");
      router.push("/profile");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to update profile"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="w-full rounded-2xl border-none bg-white p-10 shadow-none">
      <form id={PROFILE_FORM_ID} className="space-y-10" noValidate onSubmit={handleSubmit}>
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
              aria-label={avatarUrl ? "Change profile photo" : "Upload profile photo"}
              onClick={openFilePicker}
              disabled={uploading}
              className="absolute bottom-2 right-2 rounded-full border bg-white p-2 shadow hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Camera size={16} className="text-gray-700" />
            </button>

            {avatarUrl ? (
              <button
                type="button"
                aria-label="Remove profile photo"
                onClick={clearAvatar}
                className="absolute bottom-2 left-2 rounded-full border bg-white p-2 shadow hover:bg-gray-50"
              >
                <Trash2 size={16} className="text-red-500" />
              </button>
            ) : null}
          </div>
          {uploading ? <p className="mt-2 text-xs text-gray-400">Uploading profile image...</p> : null}

          <h2 className="mt-6 text-2xl font-semibold text-[#030401]">
            {displayName}
          </h2>

          <p className="text-sm text-[#909090]">{user?.email || "—"}</p>

          <p className="mt-3 max-w-lg text-center text-sm leading-relaxed text-[#909090]">
            {values.bio || "No description provided."}
          </p>
        </div>

        <div className="mx-auto max-w-[80%] space-y-6 min-w-[70%]">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <FormInput
              label="First Name *"
              value={values.firstName}
              onChange={(value) => updateValue("firstName", value)}
              placeholder="Enter first name"
            />
            <FormInput
              label="Last Name *"
              value={values.lastName}
              onChange={(value) => updateValue("lastName", value)}
              placeholder="Enter last name"
            />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <FormInput
              label="Phone Number"
              value={values.phone}
              onChange={(value) => updateValue("phone", value)}
              placeholder="Enter phone number"
            />
            <div className="hidden md:block" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Bio
            </label>
            <textarea
              value={values.bio}
              onChange={(event) => updateValue("bio", event.target.value)}
              placeholder="Tell customers a little about you"
              className="min-h-28 w-full rounded-[9px] border border-[#BBBBBB] px-3 py-2 text-sm outline-none focus:border-2 focus:border-primary"
            />
          </div>

          <Button
            type="submit"
            disabled={saving || uploading}
            className="h-[46px] w-full rounded-xl bg-primary text-white hover:bg-red-600"
          >
            {saving ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function FormInput({
  label,
  placeholder,
  value,
  onChange,
  readOnly,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </label>

      <Input
        value={value}
        readOnly={readOnly}
        placeholder={placeholder}
        onChange={(event) => onChange?.(event.target.value)}
        className="h-11 w-full rounded-[9px] border-[#BBBBBB] focus:border-2 focus:border-primary focus-visible:ring-0 focus:outline-none read-only:bg-gray-50"
      />
    </div>
  );
}
