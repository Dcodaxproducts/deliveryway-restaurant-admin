"use client";

import { useTranslations } from "next-intl";

const RegisterInfoPage = () => {
  const t = useTranslations("auth");

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center">
        <div className="w-full rounded-3xl border border-border bg-card p-6 text-center shadow-sm sm:p-10 lg:p-14">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <span className="text-2xl font-bold">A</span>
          </div>

          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-primary">
            {t("adminPanel")}
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {t("registerInfoTitle")}
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
            {t("registerInfoDescription")}
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="https://restaurant-landing-page-brown-eight.vercel.app/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 sm:w-auto"
            >
              {t("goToRegistrationPage")}
            </a>

            <a
              href="/login"
              className="inline-flex w-full items-center justify-center rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-muted sm:w-auto"
            >
              {t("adminLogin")}
            </a>
          </div>

          <div className="mt-10 grid gap-4 text-left sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-background p-4">
              <h2 className="text-sm font-semibold text-foreground">
                {t("registerRestaurant")}
              </h2>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {t("registerRestaurantDescription")}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-background p-4">
              <h2 className="text-sm font-semibold text-foreground">
                {t("approvalProcess")}
              </h2>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {t("approvalProcessDescription")}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-background p-4">
              <h2 className="text-sm font-semibold text-foreground">
                {t("manageOperations")}
              </h2>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {t("manageOperationsDescription")}
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default RegisterInfoPage;
