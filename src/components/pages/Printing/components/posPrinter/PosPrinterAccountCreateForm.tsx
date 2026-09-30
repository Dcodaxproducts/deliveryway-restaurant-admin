"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslations } from "next-intl";

import { FormField } from "@/components/common/FormField";
import FormInput from "@/components/forms/common/FormInput";
import { FormSelect } from "@/components/ui/form-select";
import { Input } from "@/components/ui/input";
import { isPosPrinterIdentifierConflict } from "@/services/pos-printer";
import {
  buildPosPrinterAccountCreateSchema,
  isPosPrinterErrorCode,
  normalizePosPrinterUsername,
  POS_PRINTER_DISPLAY_NAME_MAX,
  POS_PRINTER_PASSWORD_MIN,
  POS_PRINTER_USERNAME_MAX,
  type PosPrinterAccountCreateValues,
} from "@/validations/pos-printer";

export type PosPrinterBranchOption = { id: string; name: string };

export type PosPrinterAccountCreateFormProps = {
  formId: string;
  /** Business admins pick the branch; branch admins are scoped to their own branch. */
  isBusinessAdmin: boolean;
  fixedBranchName?: string;
  branches: { options: PosPrinterBranchOption[]; isPending: boolean; isError: boolean };
  onSubmit: (values: PosPrinterAccountCreateValues) => Promise<void>;
  /** Called for failures other than a taken username, which is shown inline. */
  onError: (error: unknown) => void;
};

const USERNAME_TAKEN = "usernameTaken";

export const POS_PRINTER_ACCOUNT_CREATE_DEFAULTS: PosPrinterAccountCreateValues = {
  displayName: "",
  username: "",
  password: "",
  branchId: "",
};

export function PosPrinterAccountCreateForm({
  formId,
  isBusinessAdmin,
  fixedBranchName,
  branches,
  onSubmit,
  onError,
}: PosPrinterAccountCreateFormProps) {
  const t = useTranslations("posPrinter");
  const schema = useMemo(
    () => buildPosPrinterAccountCreateSchema({ requireBranch: isBusinessAdmin }),
    [isBusinessAdmin]
  );
  const {
    control,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors },
  } = useForm<PosPrinterAccountCreateValues>({
    resolver: zodResolver(schema),
    defaultValues: POS_PRINTER_ACCOUNT_CREATE_DEFAULTS,
  });

  const errorText = (message?: string) => {
    if (!message) return undefined;
    if (message === USERNAME_TAKEN || isPosPrinterErrorCode(message)) return t(`errors.${message}`);
    return message;
  };

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch (error) {
      if (isPosPrinterIdentifierConflict(error)) {
        setError("username", { type: "server", message: USERNAME_TAKEN });
        setFocus("username");
        return;
      }
      onError(error);
    }
  });

  return (
    <form
      id={formId}
      className="grid gap-4 sm:grid-cols-2"
      noValidate
      onSubmit={submit}
      data-testid="pos-printer-account-create-form"
    >
      <Controller
        control={control}
        name="displayName"
        render={({ field }) => (
          <FormField
            id={`${formId}-display-name`}
            label={t("displayName")}
            required
            help={t("displayNameHint")}
            error={errorText(errors.displayName?.message)}
          >
            {(controlProps) => (
              <Input
                {...controlProps}
                name={field.name}
                value={field.value}
                onChange={(event) => field.onChange(event.target.value)}
                onBlur={field.onBlur}
                ref={field.ref}
                type="text"
                autoComplete="off"
                maxLength={POS_PRINTER_DISPLAY_NAME_MAX}
                placeholder={t("displayNamePlaceholder")}
              />
            )}
          </FormField>
        )}
      />

      <Controller
        control={control}
        name="username"
        render={({ field }) => (
          <FormField
            id={`${formId}-username`}
            label={t("username")}
            required
            help={t("usernameHint")}
            error={errorText(errors.username?.message)}
          >
            {(controlProps) => (
              <Input
                {...controlProps}
                name={field.name}
                value={field.value}
                onChange={(event) => field.onChange(normalizePosPrinterUsername(event.target.value))}
                onBlur={field.onBlur}
                ref={field.ref}
                type="text"
                inputMode="text"
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                maxLength={POS_PRINTER_USERNAME_MAX}
                placeholder={t("usernamePlaceholder")}
              />
            )}
          </FormField>
        )}
      />

      <div className="sm:col-span-2">
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <FormInput
              {...field}
              id={`${formId}-password`}
              label={t("initialPassword")}
              type="password"
              autoComplete="new-password"
              minLength={POS_PRINTER_PASSWORD_MIN}
              showPasswordToggle
              required
              error={Boolean(errors.password)}
              errorText={errorText(errors.password?.message)}
            />
          )}
        />
        <p className="mt-2 text-xs leading-5 text-[var(--ui-text-subtle)]">{t("passwordHint")}</p>
      </div>

      <div className="sm:col-span-2">
        {isBusinessAdmin ? (
          <Controller
            control={control}
            name="branchId"
            render={({ field }) => (
              <FormField
                id={`${formId}-branch`}
                label={t("branch")}
                required
                error={
                  branches.isError ? t("branchesLoadError") : errorText(errors.branchId?.message)
                }
              >
                {(controlProps) => (
                  <FormSelect
                    {...controlProps}
                    name={field.name}
                    value={field.value}
                    onChange={(event) => field.onChange(event.target.value)}
                    onBlur={field.onBlur}
                    disabled={branches.isPending}
                  >
                    <option value="" disabled>
                      {branches.isPending ? t("loadingBranches") : t("selectBranch")}
                    </option>
                    {branches.options.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </FormSelect>
                )}
              </FormField>
            )}
          />
        ) : (
          <FormField id={`${formId}-branch`} label={t("branch")}>
            {(controlProps) => (
              <Input
                {...controlProps}
                type="text"
                readOnly
                value={fixedBranchName ?? ""}
                aria-readonly="true"
                className="bg-[var(--ui-surface-subtle)]"
              />
            )}
          </FormField>
        )}
      </div>
    </form>
  );
}
