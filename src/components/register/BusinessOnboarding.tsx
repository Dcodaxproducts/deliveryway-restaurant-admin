"use client";

import { useEffect, useState } from "react";

import StorePublished from "./StorePublished";
import UserInfoStep from "./form/UserInfoStep";
import TenantInfoStep from "./TenantInfoStep";
import BranchStep from "./BranchStep";
import SettingsStep from "./SettingsStep";
import { authApi } from "@/services/auth/auth.api";
import { useRouter } from "next/navigation";

const steps = [
  { id: 1, label: "Account" },
  { id: 2, label: "Tenant & Restaurant" },
  { id: 3, label: "Branch" },
  { id: 4, label: "Payment & Delivery" },
  { id: 5, label: "Published" },
];

export default function BusinessOnboarding() {
  const [activeStep, setActiveStep] = useState<number>(1);
const router = useRouter();
  /* ================= GLOBAL FORM DATA ================= */

  const [formData, setFormData] = useState({
    user: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      phone: "",
      profileUrl: "",
    },

    tenant: {
      name: "",
      bio: "",
      logoUrl: "",
    },

    restaurant: {
      name: "",
      slug: "",
      tagline: "",
      logoUrl: "",
      supportContact: {
        email: "",
        whatsapp: "",
        phone: "",
      },
      branding: {
        primaryColor: "#e4002b",
        secondaryColor: "#ffffff",
        fontFamily: "Poppins",
      },
    },

    branch: {
      name: "",
      description: "",
      coverImage: "",
      address: {
        street: "",
        area: "",
        city: "",
        state: "",
        country: "Pakistan",
        lat: "",
        lng: "",
      },

      settings: {
        taxPercentage: 0,
        isFreeDelivery: false,
        freeDeliveryThreshold: 0,
        deliveryFee: 0,
        minOrderAmount: 0,
        radiusKm: 0,
        allowedOrderTypes: [],
        allowedPaymentMethods: [],
        autoAcceptOrders: false,
        estimatedPrepTime: 0,
      },
    },
  });

  useEffect(() => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}, [activeStep]);
  /* ================= UPDATE HELPER ================= */

  const updateFormData = (section: string, data: any) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        ...data,
      },
    }));
  };

  const activeIndex = steps.findIndex((s) => s.id === activeStep);

  /* ================= API SUBMISSION ================= */

  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    
    // Mapping local state to the Backend's expected JSON structure
    const payload = {
      user: {
        email: formData.user.email,
        password: formData.user.password,
        firstName: formData.user.firstName,
        lastName: formData.user.lastName,
        avatarUrl: formData.user.profileUrl,
        bio: "", // Add if available in your form
      },
      tenant: {
        name: formData.tenant.name,
        slug: formData.restaurant.slug, // Common practice to use restaurant slug for tenant
        logoUrl: formData.tenant.logoUrl,
        bio: formData.tenant.bio,
        socialLinks: {},
        settings: {},
      },
      restaurant: {
        name: formData.restaurant.name,
        slug: formData.restaurant.slug,
        logoUrl: formData.restaurant.logoUrl,
        customDomain: "", 
        bio: "",
        tagline: formData.restaurant.tagline,
        supportContact: formData.restaurant.supportContact,
        branding: formData.restaurant.branding,
        socialMedia: {},
      },
      branch: {
        name: formData.branch.name,
        street: formData.branch.address.street,
        city: formData.branch.address.city,
        state: formData.branch.address.state,
        country: formData.branch.address.country,
        area: formData.branch.address.area,
        coverImage: formData.branch.coverImage,
        description: formData.branch.description,
        settings: {
          allowedOrderTypes: formData.branch.settings.allowedOrderTypes,
          allowedPaymentMethods: formData.branch.settings.allowedPaymentMethods,
          deliveryConfig: {
            radiusKm: formData.branch.settings.radiusKm,
            minOrderAmount: formData.branch.settings.minOrderAmount,
            deliveryFee: formData.branch.settings.deliveryFee,
            isFreeDelivery: formData.branch.settings.isFreeDelivery,
            freeDeliveryThreshold: formData.branch.settings.freeDeliveryThreshold,
          },
          automation: {
            autoAcceptOrders: formData.branch.settings.autoAcceptOrders,
            estimatedPrepTime: formData.branch.settings.estimatedPrepTime,
          },
          taxation: {
            taxPercentage: formData.branch.settings.taxPercentage,
          },
          contact: {
            whatsapp: formData.restaurant.supportContact.whatsapp,
            phone: formData.restaurant.supportContact.phone,
          },
        },
      },
    };

    try {
      await authApi.registerTenant(payload);
      setActiveStep(5);
      router.push("/login");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to register";
      alert(`Error: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  /* ================= RENDER STEP ================= */

  const renderStepContent = () => {
    switch (activeStep) {
      case 1:
        return (
          <UserInfoStep
            formData={formData}
            updateFormData={updateFormData}
            next={() => setActiveStep(2)}
          />
        );

      case 2:
        return (
          <TenantInfoStep
            formData={formData}
            updateFormData={updateFormData}
            next={() => setActiveStep(3)}
            back={() => setActiveStep(1)}
          />
        );

      case 3:
        return (
          <BranchStep
            formData={formData}
            updateFormData={updateFormData}
            next={() => setActiveStep(4)}
            back={() => setActiveStep(2)}
          />
        );

      case 4:
        return (
          <SettingsStep
            formData={formData}
            updateFormData={updateFormData}
            next={handleSubmit} // Trigger the API call
            back={() => setActiveStep(3)}
            isLoading={loading} // Pass loading state if your button supports it
          />
        );

      case 5:
        return <StorePublished formData={formData} />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen px-4 sm:px-6 md:px-10 py-10">
      {/* HEADER */}
      <div className="text-center mb-8 sm:mb-10">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
          Business Onboarding
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Complete the steps below to set up your business
        </p>
      </div>

      {/* ================= STEPPER ================= */}
      <div className="max-w-5xl mx-auto mb-10 relative overflow-x-auto">
        <div className="flex items-center justify-between relative min-w-[500px] sm:min-w-full">
          <div className="absolute top-5 left-0 w-full border-t border-dashed border-[#909090]" />

          <div
            className="absolute top-5 left-0 border-t border-dashed border-primary z-0"
            style={{
              width: `${((activeIndex + 0.5) / steps.length) * 100}%`,
            }}
          />

          {steps.map((step, index) => {
            const isCompleted = index < activeIndex;
            const isActive = step.id === activeStep;

            return (
              <button
                key={step.id}
                // onClick={() => setActiveStep(step.id)}
                className="relative z-10 flex flex-col items-center flex-1 min-w-[60px]"
              >
                <div
                  className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-semibold transition
                  ${
                    isCompleted
                      ? "bg-primary text-white"
                      : isActive
                      ? "bg-primary text-white"
                      : "bg-white border border-[#909090] text-[#909090]"
                  }`}
                >
                  {isCompleted ? "✓" : step.id}
                </div>

                <span
                  className={`mt-2 text-[9px] sm:text-xs text-center transition ${
                    isActive
                      ? "text-primary font-medium"
                      : "text-[#909090]"
                  }`}
                >
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP CONTENT */}
      <div className="mt-8">{renderStepContent()}</div>
    </div>
  );
}