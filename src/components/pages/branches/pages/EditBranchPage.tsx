"use client";

import { JSX, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import Header from "@/components/pages/Branches/components/header";
import Container from "@/components/common/Container";
import TabButton from "@/components/ui/TabButton";
import { useAuth } from "@/hooks/useAuth";
import {
  useGetBranchDeliveryTime,
  useGetBranchForEdit,
  useUpdateBranchDeliveryTime,
  useUpdateBranchForEdit,
} from "@/hooks/useBranches";
import {
  buildBranchPatchPayload,
  buildSafeBranchSettings,
  editBranchSchema,
  EditBranchBasicInfoStep,
  EditBranchDeliveryStep,
  EditBranchSectionHeader,
  EditBranchWorkingHoursStep,
  getBranchSettingsValidationError,
  getDeliveryConfigValidationError,
  hydrateBranchForEdit,
  normalizeDeliveryConfigForApi,
  type BranchFormData,
  type BranchSettings,
  type EditTab,
} from "@/components/pages/branches/forms/EditBranchForm";
import { useTranslations } from "next-intl";

type StepConfig = {
  key: EditTab;
  tabLabel: string;
  title: string;
  description: string;
  component: JSX.Element;
};

type BranchesEditPageProps = {
  requestedBranchId: string | null;
};

export function BranchesEditPage({ requestedBranchId }: BranchesEditPageProps) {
  const t = useTranslations("branches");
  const [activeTab, setActiveTab] = useState<EditTab>("basicInfo");
  const [branchData, setBranchData] = useState<BranchFormData | null>(null);

  const router = useRouter();
  const { isBranchAdmin, branchId: authBranchId } = useAuth();
  const updateBranchMutation = useUpdateBranchForEdit();
  const updateDeliveryTimeMutation = useUpdateBranchDeliveryTime();
  const branchId = isBranchAdmin ? authBranchId || requestedBranchId : requestedBranchId;

  const branchQuery = useGetBranchForEdit(branchId);
  const deliveryTimeQuery = useGetBranchDeliveryTime(branchId);

  useEffect(() => {
    if (isBranchAdmin && requestedBranchId && authBranchId && requestedBranchId !== authBranchId) {
      toast.error(t("notAllowedForBranch"));
      router.replace(`/branches/edit?branchId=${authBranchId}`);
      return;
    }

    if (branchQuery.data) {
      const hydratedBranch = hydrateBranchForEdit(branchQuery.data);
      const deliveryTimeSettings = deliveryTimeQuery.data
        ? {
            deliveryTime: deliveryTimeQuery.data.deliveryTime,
            deliveryIntervalMinutes:
              deliveryTimeQuery.data.deliveryIntervalMinutes,
            pickupIntervalMinutes:
              deliveryTimeQuery.data.pickupIntervalMinutes,
          }
        : {};

      setBranchData({
        ...hydratedBranch,
        settings: {
          ...(hydratedBranch.settings || {}),
          ...deliveryTimeSettings,
        },
      });
    }
  }, [
    authBranchId,
    branchQuery.data,
    deliveryTimeQuery.data,
    isBranchAdmin,
    requestedBranchId,
    router,
    t,
  ]);

  useEffect(() => {
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }, [activeTab]);

  const saveBasicInfo = async (fullSettings: BranchSettings) => {
    const parsed = editBranchSchema.safeParse(branchData);

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? t("somethingWentWrong"));
      return false;
    }

    await updateBranchMutation.mutateAsync({
      id: branchId as string,
      data: buildBranchPatchPayload(branchData as BranchFormData, fullSettings),
    });

    toast.success(t("basicInfoUpdated"));
    return true;
  };

  const saveDeliveryConfig = async (fullSettings: BranchSettings) => {
    await updateBranchMutation.mutateAsync({
      id: branchId as string,
      data: { settings: fullSettings },
    });

    toast.success(t("deliveryConfigUpdated"));
    return true;
  };

  const toNonNegativeInteger = (value: unknown) => {
    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed < 0) return 0;

    return Math.trunc(parsed);
  };

  const saveWorkingHours = async (fullSettings: BranchSettings) => {
    await updateDeliveryTimeMutation.mutateAsync({
      branchId: branchId as string,
      data: {
        deliveryTime: toNonNegativeInteger(fullSettings.deliveryTime),
        deliveryIntervalMinutes: toNonNegativeInteger(
          fullSettings.deliveryIntervalMinutes
        ),
        pickupIntervalMinutes: toNonNegativeInteger(
          fullSettings.pickupIntervalMinutes
        ),
      },
    });

    return true;
  };

  const handleSave = async () => {
    if (!branchId || !branchData) return;

    try {
      const settings = branchData.settings || {};
      const deliveryConfig = normalizeDeliveryConfigForApi(settings.deliveryConfig);
      const validationError =
        activeTab === "delivery"
          ? getDeliveryConfigValidationError(deliveryConfig)
          : getBranchSettingsValidationError(settings);

      if (validationError) {
        toast.error(validationError);
        return;
      }

      const fullSettings = buildSafeBranchSettings(settings, deliveryConfig);
      const saveSucceeded =
        activeTab === "basicInfo"
          ? await saveBasicInfo(fullSettings)
          : activeTab === "delivery"
            ? await saveDeliveryConfig(fullSettings)
            : await saveWorkingHours(fullSettings);

      if (!saveSucceeded) return;

      if (activeTab === "workingHours") {
        router.push(isBranchAdmin ? "/branch-workspace" : "/branches");
      } else if (activeTab === "basicInfo") {
        setActiveTab("delivery");
      } else {
        setActiveTab("workingHours");
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : t("somethingWentWrong"));
    }
  };

  const steps: StepConfig[] = useMemo(
    () => [
      {
        key: "basicInfo",
        tabLabel: t("basicInformation"),
        title: t("setupBasicInformation"),
        description: t("basicInformationDescription"),
        component: <EditBranchBasicInfoStep data={branchData} setData={setBranchData} />,
      },
      {
        key: "delivery",
        tabLabel: t("deliveryAreaCharges"),
        title: t("deliveryAreaChargesSetup"),
        description: t("deliveryAreaChargesDescription"),
        component: <EditBranchDeliveryStep data={branchData} setData={setBranchData} />,
      },
      {
        key: "workingHours",
        tabLabel: t("workingHours"),
        title: t("setupWorkingHour"),
        description: t("workingHoursDescription"),
        component: (
          <EditBranchWorkingHoursStep
            data={branchData}
            setData={setBranchData}
            loadingDeliveryTime={deliveryTimeQuery.isLoading}
          />
        ),
      },
    ],
    [branchData, deliveryTimeQuery.isLoading, t]
  );

  const currentStep = steps.find((step) => step.key === activeTab) ?? steps[0];
  const currentStepIndex = Math.max(
    steps.findIndex((step) => step.key === currentStep.key),
    0
  );
  const branchName = branchData?.name?.trim();
  const headerTitle = branchName
    ? t("editBranchTitle", { name: branchName })
    : t("editBranch");
  const headerDescription = t("editBranchDescription", {
    step: currentStepIndex + 1,
    total: steps.length,
    section: currentStep.tabLabel,
  });

  return (
    <Container>
      <Header
        title={headerTitle}
        description={headerDescription}
      />

      <div className="space-y-8 rounded-[14px] bg-white shadow-sm lg:p-8">
        <div className="flex flex-wrap items-center gap-3">
          {steps.map(({ key, tabLabel }) => (
            <TabButton key={key} active={activeTab === key} onClick={() => setActiveTab(key)}>
              {tabLabel}
            </TabButton>
          ))}
        </div>

        <EditBranchSectionHeader
          title={currentStep.title}
          description={currentStep.description}
          onPrimaryAction={handleSave}
        />

        {currentStep.component}
      </div>
    </Container>
  );
}
