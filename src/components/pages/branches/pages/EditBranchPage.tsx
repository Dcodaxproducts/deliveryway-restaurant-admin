"use client";

import { JSX, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import Header from "@/components/branches/header";
import Container from "@/components/container";
import TabButton from "@/components/ui/TabButton";
import { useAuth } from "@/hooks/useAuth";
import { useHttpClient } from "@/hooks/useHttpClient";
import {
  buildBranchPatchPayload,
  buildSafeBranchSettings,
  EditBranchBasicInfoStep,
  EditBranchDeliveryStep,
  EditBranchSectionHeader,
  EditBranchWorkingHoursStep,
  getDeliveryConfigValidationError,
  normalizeDeliveryConfigForApi,
  normalizeHolidayRangesForApi,
  normalizeOpeningHoursForApi,
  type BranchFormData,
  type EditTab,
} from "@/components/pages/branches/forms/EditBranchForm";

type StepConfig = {
  key: EditTab;
  tabLabel: string;
  title: string;
  description: string;
  component: JSX.Element;
};

const getBranchResponseData = (response: any) => response?.data?.data || response?.data;

export default function BranchesEditPage() {
  const [activeTab, setActiveTab] = useState<EditTab>("basicInfo");
  const [branchData, setBranchData] = useState<BranchFormData | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedBranchId = searchParams.get("branchId");
  const { token, isBranchAdmin, branchId: authBranchId } = useAuth();
  const { request } = useHttpClient(token);
  const branchId = isBranchAdmin ? authBranchId || requestedBranchId : requestedBranchId;

  useEffect(() => {
    if (isBranchAdmin && requestedBranchId && authBranchId && requestedBranchId !== authBranchId) {
      toast.error("Not allowed for this branch/account");
      router.replace(`/branches/edit?branchId=${authBranchId}`);
      return;
    }

    if (!branchId || !token) return;

    const fetchBranch = async () => {
      const response = await request(`/v1/branches/${branchId}`);

      if (response?.error) {
        toast.error(response.error);
        return;
      }

      const nextBranchData = getBranchResponseData(response);
      if (nextBranchData) setBranchData(nextBranchData);
    };

    fetchBranch();
  }, [authBranchId, branchId, isBranchAdmin, requestedBranchId, request, router, token]);

  const saveBasicInfo = async (fullSettings: any) => {
    const response = await request(
      `/v1/branches/${branchId}`,
      "PATCH",
      buildBranchPatchPayload(branchData as BranchFormData, fullSettings)
    );

    if (response?.error) {
      toast.error(response.error);
      return false;
    }

    toast.success("Basic info updated");
    return true;
  };

  const saveDeliveryConfig = async (fullSettings: any) => {
    const response = await request(`/v1/branches/${branchId}`, "PATCH", {
      settings: fullSettings,
    });

    if (response?.error) {
      toast.error(response.error);
      return false;
    }

    toast.success("Delivery config updated");
    return true;
  };

  const saveWorkingHours = async (fullSettings: any) => {
    const settings = branchData?.settings || {};

    const openingHoursResponse = await request(
      `/v1/branches/${branchId}/opening-hours`,
      "PUT",
      {
        openingHours: normalizeOpeningHoursForApi(settings.openingHours),
        settings: {
          holidayRanges: normalizeHolidayRangesForApi(settings.holidayRanges),
        },
      }
    );

    if (openingHoursResponse?.error) {
      toast.error(openingHoursResponse.error);
      return false;
    }

    const branchResponse = await request(
      `/v1/branches/${branchId}`,
      "PATCH",
      buildBranchPatchPayload(branchData as BranchFormData, fullSettings)
    );

    if (branchResponse?.error) {
      toast.error(branchResponse.error);
      return false;
    }

    toast.success("Working hours updated");
    return true;
  };

  const handleSave = async () => {
    if (!branchId || !branchData) return;

    try {
      const settings = branchData.settings || {};
      const deliveryConfig = normalizeDeliveryConfigForApi(settings.deliveryConfig);
      const validationError =
        activeTab === "delivery" ? getDeliveryConfigValidationError(deliveryConfig) : null;

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
    } catch (error: any) {
      toast.error(error?.message || "Something went wrong");
    }
  };

  const steps: StepConfig[] = useMemo(
    () => [
      {
        key: "basicInfo",
        tabLabel: "Basic Information",
        title: "Setup Basic Information",
        description: "Manage your branch's basic information from here",
        component: <EditBranchBasicInfoStep data={branchData} setData={setBranchData} />,
      },
      {
        key: "delivery",
        tabLabel: "Delivery Area & Charges",
        title: "Zone & Delivery Area & Charges Setup",
        description: "Configure delivery by radius, delivery zones, or postal code rules",
        component: <EditBranchDeliveryStep data={branchData} setData={setBranchData} />,
      },
      {
        key: "workingHours",
        tabLabel: "Working Hours",
        title: "Setup Working Hour",
        description: "Configure business hours, break times, and holiday date ranges from here",
        component: <EditBranchWorkingHoursStep data={branchData} setData={setBranchData} />,
      },
    ],
    [branchData]
  );

  const currentStep = steps.find((step) => step.key === activeTab) ?? steps[0];

  return (
    <Container>
      <Header
        title={isBranchAdmin ? "My Branch" : "Default Branch"}
        description={isBranchAdmin ? "Manage assigned branch settings only" : "Branch Setup / Default Branch"}
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
