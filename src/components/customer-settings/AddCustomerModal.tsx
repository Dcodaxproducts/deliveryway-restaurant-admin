"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { useAuthContext } from "@/components/providers/auth-provider"
import { toast } from "sonner"
import { httpClient } from "@/lib/axios"
import { useCreateCustomer, useUpdateCustomer } from "@/hooks/useCustomers"

interface Customer {
  id?: string
  email?: string
  password?: string
  isActive?: boolean
  createdAt?: string
  profile?: {
    firstName?: string
    lastName?: string
    phone?: string
  }
}
interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  initialData?: Customer | null
  onSuccess?: () => void
}
export default function AddCustomerModal({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: Props) {
  const { user } = useAuthContext();
  const restaurantId = user?.restaurantId;
  const isEditMode = !!initialData?.id;

  const createCustomerMutation = useCreateCustomer();
  const updateCustomerMutation = useUpdateCustomer();

  const isSubmitting =
    createCustomerMutation.isPending || updateCustomerMutation.isPending;

  const [step, setStep] = useState<"form" | "otp">("form");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        setForm({
          email: initialData.email || "",
          password: "",
          firstName: initialData.profile?.firstName || "",
          lastName: initialData.profile?.lastName || "",
          phone: initialData.profile?.phone || "",
        });
      } else {
        setForm({
          email: "",
          password: "",
          firstName: "",
          lastName: "",
          phone: "",
        });
      }

      setStep("form");
      setOtp("");
      setAccessToken(null);
    }
  }, [open, initialData]);

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetModalState = () => {
    setForm({
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      phone: "",
    });
    setOtp("");
    setStep("form");
    setAccessToken(null);
  };

  const handleSubmit = async () => {
    if (!form.email || !form.firstName || !form.lastName || !form.phone) {
      toast.error("Please fill all required fields");
      return;
    }

    if (!isEditMode && !form.password) {
      toast.error("Please fill all fields");
      return;
    }

    if (isEditMode && initialData?.id) {
      const payload = {
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
      };

      try {
        await updateCustomerMutation.mutateAsync({
          id: initialData.id,
          data: payload,
        });

        onSuccess?.();
        resetModalState();
        onOpenChange(false);
      } catch {
        // toast already handled in hook
      }

      return;
    }

    try {
      const res = await createCustomerMutation.mutateAsync({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        restaurantId: restaurantId || "",
      });

      const tokenFromRes = res?.data?.accessToken;

      if (!tokenFromRes) {
        toast.error("Missing access token");
        return;
      }

      setAccessToken(tokenFromRes);
      localStorage.setItem("signupAccessToken", tokenFromRes);

      toast.success("OTP sent to email");
      setStep("otp");
    } catch {
      // toast already handled in hook
    }
  };

  const handleVerifyOtp = async () => {
    const tokenToUse =
      accessToken || localStorage.getItem("signupAccessToken");

    if (!otp) {
      toast.error("Please enter OTP");
      return;
    }

    if (!tokenToUse) {
      toast.error("Missing access token");
      return;
    }

    try {
      setIsVerifying(true);

      await httpClient.post("/auth/verify-email", { otp }, {
        headers: {
          Authorization: `Bearer ${tokenToUse}`,
        },
      });

      toast.success("Customer verified successfully!");

      localStorage.removeItem("signupAccessToken");
      onSuccess?.();
      resetModalState();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Verification failed");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        if (!v) {
          resetModalState()
        }
      }}
    >
      <DialogContent className="max-w-[420px] rounded-[20px] p-6 bg-[#F5F5F5]">

        {/* HEADER */}
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-2xl font-semibold">
            {step === "form"
              ? isEditMode
                ? "Edit Customer"
                : "Add Customer"
              : "Verify Email"}
          </DialogTitle>

          <p className="text-sm text-gray-500">
            {step === "form"
              ? isEditMode
                ? "Update customer account details"
                : "Create a new customer account"
              : "Enter OTP sent to customer's email"}
          </p>
        </DialogHeader>

        {/* ================= FORM STEP ================= */}
        {step === "form" && (
          <div className="mt-5 bg-white rounded-[16px] p-5 space-y-4">

            {/* FIRST NAME */}
            <div className="space-y-1">
              <p className="text-sm text-gray-600">First Name</p>
              <Input
                value={form.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                placeholder="Enter first name"
                className="h-[44px] rounded-[10px] border border-gray-300"
              />
            </div>

            {/* LAST NAME */}
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Last Name</p>
              <Input
                value={form.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                placeholder="Enter last name"
                className="h-[44px] rounded-[10px] border border-gray-300"
              />
            </div>

            {/* EMAIL */}
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Email</p>
              <Input
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="Enter email"
                className="h-[44px] rounded-[10px] border border-gray-300"
              />
            </div>

            {/* PHONE */}
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Phone</p>
              <Input
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="Enter phone number"
                className="h-[44px] rounded-[10px] border border-gray-300"
              />
            </div>

            {/* PASSWORD */}
          {!isEditMode && (
  <div className="space-y-1">
    <p className="text-sm text-gray-600">Password</p>
    <Input
      type="password"
      value={form.password}
      onChange={(e) => handleChange("password", e.target.value)}
      placeholder="Enter password"
      className="h-[44px] rounded-[10px] border border-gray-300"
    />
  </div>
)}

            {/* BUTTON */}
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full h-[48px] rounded-[10px] mt-2 bg-primary"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={18} />
                  {isEditMode ? "Updating..." : "Creating..."}
                </span>
              ) : isEditMode ? (
                "Update Customer"
              ) : (
                "Create Customer"
              )}
            </Button>

          </div>
        )}

        {/* ================= OTP STEP ================= */}
        {!isEditMode && step === "otp" && (
          <div className="mt-5 bg-white rounded-[16px] p-5 space-y-4">

            <div className="space-y-1">
              <p className="text-sm text-gray-600">Enter OTP</p>
              <Input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
                className="h-[44px] rounded-[10px] border border-gray-300 text-center tracking-widest"
              />
            </div>

            <Button
              onClick={handleVerifyOtp}
              disabled={isVerifying}
              className="w-full h-[48px] rounded-[10px] mt-2 bg-primary"
            >
              {isVerifying ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={18} />
                  Verifying...
                </span>
              ) : (
                "Verify OTP"
              )}
            </Button>

          </div>
        )}

      </DialogContent>
    </Dialog>
  )
}