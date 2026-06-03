"use client";

import { usePathname, useRouter } from "next/navigation";
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
  const common = useTranslations("common");
  const isEditPage = pathname === "/profile/edit";

  return (
    <div className="flex w-full flex-col gap-4 md:gap-6 lg:flex-row lg:items-center lg:justify-between">
      <PageHeader title={title} description={description} />

      <Button
        variant="default"
        type={isEditPage ? "submit" : "button"}
        form={isEditPage ? "profile-edit-form" : undefined}
        className="w-full whitespace-nowrap sm:w-auto"
        onClick={isEditPage ? undefined : () => router.push("/profile/edit")}
      >
        {isEditPage ? common("save") : profile("editProfile")}
      </Button>
    </div>
  );
}
