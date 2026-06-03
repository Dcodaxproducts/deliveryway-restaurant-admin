"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { useAuthContext } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useCreateCustomer,
  useUpdateCustomer,
  useVerifyCustomerEmail,
} from "@/hooks/useCustomers";
import {
  CARD_PANEL_CLASS,
  FIELD_ERROR_CLASS,
  MUTED_TEXT_SM_CLASS,
} from "@/components/common/common-classes";
import { getApiErrorMessage } from "@/lib/errors";
import {
  getClientStorageItem,
  removeClientStorageItem,
  setClientStorageItem,
} from "@/services/storage";
import {
  customerModalSchema,
  type CustomerModalValues,
  type UpdateCustomerValues,
} from "@/validations/customers";
import { useTranslations } from "next-intl";

type Customer = {
  id?: string;
  email?: string;
  password?: string;
  isActive?: boolean;
  createdAt?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
};

type AddCustomerModalProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialData?: Customer | null;
  onSuccess?: () => void;
};

type RegisterCustomerResponse = {
  data?: {
    accessToken?: string;
  };
};

const defaultValues: CustomerModalValues = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  phone: "",
};

export default function AddCustomerModal({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: AddCustomerModalProps) {
  const { user } = useAuthContext();
  const t = useTranslations("customers");
  const restaurantId = user?.restaurantId;
  const isEditMode = Boolean(initialData?.id);

  const createCustomerMutation = useCreateCustomer({
    messages: {
      success: t("messages.created"),
      error: t("messages.failedCreate"),
    },
  });
  const updateCustomerMutation = useUpdateCustomer({
    messages: {
      success: t("messages.updated"),
      error: t("messages.failedUpdate"),
    },
  });
  const verifyCustomerEmailMutation = useVerifyCustomerEmail({
    messages: {
      error: t("messages.verificationFailed"),
    },
  });
  const isSubmitting =
    createCustomerMutation.isPending || updateCustomerMutation.isPending;

  const [step, setStep] = useState<"form" | "otp">("form");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm<CustomerModalValues>({
    resolver: zodResolver(customerModalSchema),
    defaultValues,
  });

  const resetModalState = () => {
    reset(defaultValues);
    setOtp("");
    setStep("form");
    setAccessToken(null);
  };

  const translateValidationError = (message?: string) => {
    if (!message) return undefined;

    const validationMessages: Record<string, string> = {
      "Phone number must be at least 10 digits": t("validation.phoneMin"),
      "Phone number is too long": t("validation.phoneMax"),
      "Invalid email address": t("validation.invalidEmail"),
      "First name is required": t("validation.firstNameRequired"),
      "Last name is required": t("validation.lastNameRequired"),
      "Password must be at least 8 characters": t("validation.passwordMin"),
      "OTP is required": t("validation.otpRequired"),
      "OTP is too short": t("validation.otpShort"),
      "OTP is too long": t("validation.otpLong"),
    };

    return validationMessages[message] || message;
  };

  useEffect(() => {
    if (!open) return;

    reset(
      initialData
        ? {
            email: initialData.email ?? "",
            password: "",
            firstName: initialData.profile?.firstName ?? "",
            lastName: initialData.profile?.lastName ?? "",
            phone: initialData.profile?.phone ?? "",
          }
        : defaultValues,
    );
    setStep("form");
    setOtp("");
    setAccessToken(null);
  }, [initialData, open, reset]);

  const onSubmit = async (values: CustomerModalValues) => {
    if (!isEditMode && !values.password) {
      toast.error(t("messages.fillAllFields"));
      return;
    }

    if (isEditMode && initialData?.id) {
      const payload: UpdateCustomerValues = {
        email: values.email,
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
      };

      try {
        await updateCustomerMutation.mutateAsync({
          id: initialData.id,
          data: payload,
        });

        onSuccess?.();
        resetModalState();
        onOpenChange(false);
      } catch (error) {
        toast.error(getApiErrorMessage(error, t("messages.failedUpdate")));
      }

      return;
    }

    try {
      const res = (await createCustomerMutation.mutateAsync({
        email: values.email,
        password: values.password ?? "",
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
        restaurantId: restaurantId || "",
      })) as RegisterCustomerResponse;

      const tokenFromRes = res?.data?.accessToken;

      if (!tokenFromRes) {
        toast.error(t("messages.missingAccessToken"));
        return;
      }

      setAccessToken(tokenFromRes);
      setClientStorageItem("signupAccessToken", tokenFromRes);

      toast.success(t("messages.otpSent"));
      setStep("otp");
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("messages.failedCreate")));
    }
  };

  const handleVerifyOtp = async () => {
    const tokenToUse = accessToken || getClientStorageItem("signupAccessToken");

    if (!otp) {
      toast.error(t("messages.enterOtp"));
      return;
    }

    if (!tokenToUse) {
      toast.error(t("messages.missingAccessToken"));
      return;
    }

    try {
      setIsVerifying(true);

      await verifyCustomerEmailMutation.mutateAsync({ token: tokenToUse, otp });

      toast.success(t("messages.verified"));

      removeClientStorageItem("signupAccessToken");
      onSuccess?.();
      resetModalState();
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("messages.verificationFailed")));
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) resetModalState();
      }}
    >
      <DialogContent className="max-w-[420px] rounded-[20px] bg-[#F5F5F5] p-6">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-2xl font-semibold">
            {step === "form"
              ? isEditMode
                ? t("editCustomer")
                : t("addCustomer")
              : t("verifyEmail")}
          </DialogTitle>

          <p className={MUTED_TEXT_SM_CLASS}>
            {step === "form"
              ? isEditMode
                ? t("updateDetailsDescription")
                : t("createDetailsDescription")
              : t("verifyEmailDescription")}
          </p>
        </DialogHeader>

        {step === "form" && (
          <form
            className={`mt-5 space-y-4 ${CARD_PANEL_CLASS}`}
            noValidate
            onSubmit={handleSubmit(onSubmit)}
          >
            <CustomerField
              control={control}
              name="firstName"
              id="customer-first-name"
              label={t("form.firstName")}
              placeholder={t("form.firstNamePlaceholder")}
              error={translateValidationError(errors.firstName?.message)}
            />
            <CustomerField
              control={control}
              name="lastName"
              id="customer-last-name"
              label={t("form.lastName")}
              placeholder={t("form.lastNamePlaceholder")}
              error={translateValidationError(errors.lastName?.message)}
            />
            <CustomerField
              control={control}
              name="email"
              id="customer-email"
              label={t("form.email")}
              placeholder={t("form.emailPlaceholder")}
              error={translateValidationError(errors.email?.message)}
            />
            <CustomerField
              control={control}
              name="phone"
              id="customer-phone"
              label={t("form.phone")}
              placeholder={t("form.phonePlaceholder")}
              error={translateValidationError(errors.phone?.message)}
            />
            {!isEditMode ? (
              <CustomerField
                control={control}
                name="password"
                id="customer-password"
                label={t("form.password")}
                placeholder={t("form.passwordPlaceholder")}
                type="password"
                error={translateValidationError(errors.password?.message)}
              />
            ) : null}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 h-[48px] w-full rounded-[10px] bg-primary"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={18} />
                  {isEditMode ? t("updating") : t("creating")}
                </span>
              ) : isEditMode ? (
                t("updateCustomer")
              ) : (
                t("createCustomer")
              )}
            </Button>
          </form>
        )}

        {!isEditMode && step === "otp" && (
          <div className={`mt-5 space-y-4 ${CARD_PANEL_CLASS}`}>
            <div className="space-y-1">
              <Label htmlFor="customer-otp" className="text-sm text-gray-600">
                {t("enterOtp")}
              </Label>
              <Input
                id="customer-otp"
                value={otp}
                onChange={({ target: { value } }) => setOtp(value)}
                placeholder={t("enterOtpPlaceholder")}
                className="h-[44px] rounded-[10px] border border-gray-300 text-center tracking-widest"
              />
            </div>

            <Button
              type="button"
              onClick={handleVerifyOtp}
              disabled={isVerifying}
              className="mt-2 h-[48px] w-full rounded-[10px] bg-primary"
            >
              {isVerifying ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={18} />
                  {t("verifying")}
                </span>
              ) : (
                t("verifyOtp")
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

type CustomerFieldProps = {
  control: import("react-hook-form").Control<CustomerModalValues>;
  name: keyof CustomerModalValues;
  id: string;
  label: string;
  placeholder: string;
  type?: string;
  error?: string;
};

function CustomerField({
  control,
  name,
  id,
  label,
  placeholder,
  type = "text",
  error,
}: CustomerFieldProps) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-sm text-gray-600">
        {label}
      </Label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Input
            id={id}
            type={type}
            value={typeof field.value === "string" ? field.value : ""}
            onChange={({ target: { value } }) => field.onChange(value)}
            onBlur={field.onBlur}
            placeholder={placeholder}
            className="h-[44px] rounded-[10px] border border-gray-300"
          />
        )}
      />
      {error ? <p className={FIELD_ERROR_CLASS}>{error}</p> : null}
    </div>
  );
}
