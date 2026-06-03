"use client";

import Container from "@/components/common/Container";
import EditProfileForm from "@/components/pages/Profile/components/EditProfileForm";
import ProfileHeader from "@/components/pages/Profile/components/ProfileHeader";
import { useTranslations } from "next-intl";

export default function EditProfilePage() {
  const t = useTranslations("profile");

  return (
    <Container>
      <ProfileHeader
        title={t("managementTitle")}
        description={t("managementDescription")}
      />
      <EditProfileForm />
    </Container>
  );
}
