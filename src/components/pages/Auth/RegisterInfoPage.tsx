"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardCheck, Store } from "lucide-react";
import { useTranslations } from "next-intl";

import AuthPageShell, {
  AuthBrand,
  AuthCard,
  AUTH_DESCRIPTION_CLASS,
  AUTH_TITLE_CLASS,
} from "@/components/pages/Auth/components/AuthPageShell";
import { Button } from "@/components/ui/button";

const RegisterInfoPage = () => {
  const t = useTranslations("auth");
  const steps = [
    {
      title: t("registerRestaurant"),
      description: t("registerRestaurantDescription"),
      icon: Store,
    },
    {
      title: t("approvalProcess"),
      description: t("approvalProcessDescription"),
      icon: ClipboardCheck,
    },
    {
      title: t("manageOperations"),
      description: t("manageOperationsDescription"),
      icon: CheckCircle2,
    },
  ];

  return (
    <AuthPageShell>
      <AuthCard className="max-w-[560px]">
        <AuthBrand />

        <h1 id="auth-page-title" className={`${AUTH_TITLE_CLASS} mt-7`}>
          {t("registerInfoTitle")}
        </h1>

        <p className={AUTH_DESCRIPTION_CLASS}>{t("registerInfoDescription")}</p>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <Button asChild className="h-12 rounded-[12px]">
            <a
              href="https://restaurant-landing-page-brown-eight.vercel.app/"
              target="_blank"
              rel="noreferrer"
            >
              {t("goToRegistrationPage")}
              <ArrowRight size={16} aria-hidden="true" />
            </a>
          </Button>

          <Button asChild variant="outline" className="h-12 rounded-[12px]">
            <Link href="/login">{t("adminLogin")}</Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-3 text-left sm:grid-cols-3">
          {steps.map(({ title, description, icon: Icon }) => (
            <section key={title} className="rounded-2xl bg-[#faf8f6] p-4">
              <Icon className="size-5 text-primary" aria-hidden="true" />
              <h2 className="mt-3 text-sm font-semibold text-gray-950">
                {title}
              </h2>
              <p className="mt-1.5 text-xs leading-5 text-gray-600">
                {description}
              </p>
            </section>
          ))}
        </div>
      </AuthCard>
    </AuthPageShell>
  );
};

export default RegisterInfoPage;
