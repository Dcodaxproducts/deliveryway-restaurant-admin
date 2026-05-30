"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm, type FieldErrors, type Path } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { CARD_PANEL_CLASS, FIELD_ERROR_CLASS, MUTED_TEXT_SM_CLASS } from "@/components/common/common-classes";
import { useCreateBranch } from "@/hooks/useBranches";
import {
  createBranchSchema,
  type CreateBranchFormValues,
} from "@/validations/branches";

interface CreateBranchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const INPUT_CLASS =
  "h-[44px] rounded-[10px] px-3 text-sm placeholder:text-gray-400 border-gray-300 focus-visible:ring-1 focus-visible:ring-primary";
const PRIMARY_INPUT_CLASS = `${INPUT_CLASS} border-primary bg-primary/5`;

const defaultValues: CreateBranchFormValues = {
  restaurantId: "",
  name: "",
  street: "",
  city: "",
  state: "",
  country: "",
  area: "",
  lat: "",
  lng: "",
  isMain: false,
  branchAdmin: {
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
  },
};

type FieldConfig = {
  name: Path<CreateBranchFormValues>;
  label?: string;
  placeholder: string;
  type?: string;
  required?: boolean;
  primary?: boolean;
};

const branchFieldConfigs: FieldConfig[] = [
  {
    name: "name",
    label: "Branch Name",
    placeholder: "eg. Main Branch",
    required: true,
    primary: true,
  },
  { name: "street", label: "Street", placeholder: "Street 12" },
  { name: "city", label: "City", placeholder: "eg. Lahore" },
  { name: "state", label: "State", placeholder: "eg. Punjab" },
  { name: "country", label: "Country", placeholder: "eg. Pakistan" },
  { name: "area", label: "Area", placeholder: "eg. DHA Phase 5" },
  { name: "lat", label: "Latitude", placeholder: "eg. 31.5204" },
  { name: "lng", label: "Longitude", placeholder: "eg. 74.3587" },
];

const adminFieldConfigs: FieldConfig[] = [
  { name: "branchAdmin.firstName", placeholder: "First Name" },
  { name: "branchAdmin.lastName", placeholder: "Last Name" },
  { name: "branchAdmin.email", placeholder: "Email" },
  { name: "branchAdmin.password", placeholder: "Password", type: "password" },
  { name: "branchAdmin.phone", placeholder: "Phone" },
];

const getErrorMessage = (
  errors: FieldErrors<CreateBranchFormValues>,
  name: Path<CreateBranchFormValues>
) => {
  if (name.startsWith("branchAdmin.")) {
    const adminKey = name.split(".")[1] as keyof CreateBranchFormValues["branchAdmin"];
    return errors.branchAdmin?.[adminKey]?.message;
  }

  const fieldName = name as keyof Omit<CreateBranchFormValues, "branchAdmin">;
  return errors[fieldName]?.message;
};

export default function CreateBranchModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateBranchModalProps) {
  const { user } = useAuth();
  const createBranchMutation = useCreateBranch();

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<CreateBranchFormValues>({
    resolver: zodResolver(createBranchSchema),
    defaultValues,
  });

  useEffect(() => {
    if (!open) {
      reset(defaultValues);
    }
  }, [open, reset]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset(defaultValues);
    }

    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: CreateBranchFormValues) => {
    const restaurantId = user?.restaurantId;

    if (!restaurantId) {
      return;
    }

    try {
      await createBranchMutation.mutateAsync({
        restaurantId,
        name: values.name,
        street: values.street ?? "",
        city: values.city ?? "",
        state: values.state ?? "",
        country: values.country ?? "",
        area: values.area ?? "",
        lat: values.lat ?? "",
        lng: values.lng ?? "",
        isMain: values.isMain,
        branchAdmin: {
          email: values.branchAdmin.email ?? "",
          password: values.branchAdmin.password ?? "",
          firstName: values.branchAdmin.firstName ?? "",
          lastName: values.branchAdmin.lastName ?? "",
          phone: values.branchAdmin.phone ?? "",
        },
      });

      reset(defaultValues);
      onOpenChange(false);
      onSuccess?.();
    } catch (error: unknown) {
      void error;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[480px] rounded-[20px] p-6 bg-[#F5F5F5] max-h-[95vh] overflow-auto">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl font-semibold">Create Branch</DialogTitle>
          <p className={MUTED_TEXT_SM_CLASS}>Create a new branch from here</p>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit(onSubmit)}>
          <div className={`mt-4 ${CARD_PANEL_CLASS} space-y-4`}>
            {branchFieldConfigs.map((config) => {
              const { label, name, placeholder, primary, required, type } = config;
              const errorMessage = getErrorMessage(errors, name);
              const fieldId = `create-branch-${name.replace(/\./g, "-")}`;

              return (
                <div key={name} className="space-y-1">
                  {label ? (
                    <Label htmlFor={fieldId} className="text-sm">
                      {label} {required ? <span className="text-primary">*</span> : null}
                    </Label>
                  ) : null}
                  <Input
                    id={fieldId}
                    type={type}
                    placeholder={placeholder}
                    className={primary ? PRIMARY_INPUT_CLASS : INPUT_CLASS}
                    aria-invalid={Boolean(errorMessage)}
                    {...register(name)}
                  />
                  {errorMessage ? (
                    <p className={FIELD_ERROR_CLASS}>{errorMessage}</p>
                  ) : null}
                </div>
              );
            })}

            <div className="flex items-center justify-between">
              <Label htmlFor="create-branch-is-main" className="text-sm">
                Main Branch
              </Label>
              <Controller
                control={control}
                name="isMain"
                render={({ field }) => (
                  <Switch
                    id="create-branch-is-main"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="data-[state=checked]:bg-primary"
                  />
                )}
              />
            </div>

            <hr className="border-gray-200 my-2" />

            <h4 className="text-sm font-medium text-gray-900">Branch Admin Info</h4>

            {adminFieldConfigs.map((config) => {
              const { name, placeholder, type } = config;
              const errorMessage = getErrorMessage(errors, name);
              const fieldId = `create-branch-${name.replace(/\./g, "-")}`;

              return (
                <div key={name} className="space-y-1">
                  <Label htmlFor={fieldId} className="sr-only">
                    {placeholder}
                  </Label>
                  <Input
                    id={fieldId}
                    type={type}
                    placeholder={placeholder}
                    className={INPUT_CLASS}
                    aria-invalid={Boolean(errorMessage)}
                    {...register(name)}
                  />
                  {errorMessage ? (
                    <p className={FIELD_ERROR_CLASS}>{errorMessage}</p>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            <Button
              type="button"
              variant="ghost"
              className="text-gray-700 text-[17px]"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              className="px-8 py-2 rounded-[10px] bg-primary hover:bg-primary/90 text-[17px]"
              disabled={createBranchMutation.isPending}
            >
              {createBranchMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
