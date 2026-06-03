"use client";

import Container from "@/components/common/Container";
import ProfileHeader from "@/components/pages/Profile/components/ProfileHeader";
import UserProfile from "@/components/pages/Profile/components/UserProfile";
import { useTranslations } from "next-intl";

export default function ProfilePage() {
  const t = useTranslations("profile");

  return (
    <Container>
      <ProfileHeader
        title={t("managementTitle")}
        description={t("managementDescription")}
      />
      <UserProfile />
    </Container>
  );
}
