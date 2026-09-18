"use client";

import { usePathname, useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";

import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";

type ProfileHeaderProps = {
  title: string;
  description?: string;
};

export default function ProfileHeader({ title, description }: ProfileHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const profile = useTranslations("profile");
  const isEditPage = pathname === "/profile/edit";

  return (
    <PageHeader
      title={title}
      description={description}
      actions={
        isEditPage ? null : (
          <Button type="button" onClick={() => router.push("/profile/edit")}>
            <Pencil aria-hidden="true" />
            {profile("editProfile")}
          </Button>
        )
      }
    />
  );
}
