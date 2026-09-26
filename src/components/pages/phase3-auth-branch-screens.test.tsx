import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import AuthPageShell, {
  AuthBrand,
  AuthCard,
} from "@/components/pages/Auth/components/AuthPageShell";

const projectFile = (path: string) =>
  readFileSync(join(process.cwd(), path), "utf8");

describe("Phase 3 authentication screen family", () => {
  it("provides one accessible responsive shell and canonical auth card", () => {
    const markup = renderToStaticMarkup(
      <AuthPageShell titleId="test-auth-title">
        <AuthCard>
          <AuthBrand />
          <h1 id="test-auth-title">Sign in</h1>
        </AuthCard>
      </AuthPageShell>,
    );

    expect(markup).toContain("min-h-[100dvh]");
    expect(markup).toContain("lg:h-[100dvh]");
    expect(markup).toContain("lg:overflow-y-auto");
    expect(markup).toContain('aria-labelledby="test-auth-title"');
    expect(markup).toContain('data-slot="auth-card"');
    expect(markup).toContain("auth-viewport-card");
    expect(markup).toContain('alt="FeastFlow"');
  });

  it.each([
    "src/components/pages/Auth/LoginForm.tsx",
    "src/components/pages/Auth/ForgotPasswordForm.tsx",
    "src/components/pages/Auth/ResetPasswordForm.tsx",
    "src/components/pages/Auth/RegisterInfoPage.tsx",
  ])("keeps %s on the shared auth shell and card", (path) => {
    const source = projectFile(path);

    expect(source).toContain("<AuthPageShell");
    expect(source).toContain("<AuthCard");
    expect(source).toContain("<AuthBrand />");
  });

  it("preserves authentication API calls and role-aware redirects", () => {
    const login = projectFile("src/components/pages/Auth/LoginForm.tsx");
    const forgot = projectFile(
      "src/components/pages/Auth/ForgotPasswordForm.tsx",
    );
    const reset = projectFile(
      "src/components/pages/Auth/ResetPasswordForm.tsx",
    );

    expect(login).toContain("authApi.loginWithFallback(values)");
    expect(login).toContain("authApi.googleLogin");
    expect(login).toContain('user.role === "BRANCH_ADMIN"');
    expect(login).toContain('"/branch-workspace"');
    expect(forgot).toContain("authApi.forgotPassword(values)");
    expect(forgot).toContain("/reset-password?email=");
    expect(reset).toContain("authApi.resetPassword(values)");
    expect(reset).toContain("authApi.resendOtp");
    expect(projectFile("src/app/globals.css")).not.toContain(
      "transform: scale",
    );
  });
});

describe("Required workspace selection", () => {
  it("uses the canonical modal primitive and prevents accidental dismissal", () => {
    const source = projectFile("src/components/layout/ContextGate.tsx");

    expect(source).toContain("<Dialog open>");
    expect(source).toContain("<DialogContent");
    expect(source).toContain("showCloseButton={false}");
    expect(source).toContain('overlayClassName="z-[9998]');
    expect(source).toContain("onEscapeKeyDown");
    expect(source).toContain("onInteractOutside");
    expect(source).toContain("<DialogTitle");
    expect(source).toContain("<DialogDescription");
  });
});

describe("Phase 3 branch-management screen family", () => {
  it("uses canonical workflow, detail, and form presentation owners", () => {
    const workspace = projectFile(
      "src/components/pages/BranchWorkspace/components/branch-admin/BranchWorkspace.tsx",
    );
    const details = projectFile(
      "src/components/pages/Branches/pages/BranchDetailsPage.tsx",
    );
    const edit = projectFile(
      "src/components/pages/branches/pages/EditBranchPage.tsx",
    );

    expect(workspace).toContain("<PageHeader");
    expect(workspace).toContain("<SectionCard");
    expect(details).toContain("<DetailLayout>");
    expect(details).toContain("<DetailPanel");
    expect(details).toContain("<InfoList");
    expect(edit).toContain("<PageHeader");
    expect(edit).toContain("<FormLayout");
    expect(edit).toContain("<FormActions");
  });

  it("preserves branch scope and mutation contracts", () => {
    const workspace = projectFile(
      "src/components/pages/BranchWorkspace/components/branch-admin/BranchWorkspace.tsx",
    );
    const details = projectFile(
      "src/components/pages/Branches/pages/BranchDetailsPage.tsx",
    );
    const edit = projectFile(
      "src/components/pages/branches/pages/EditBranchPage.tsx",
    );

    expect(workspace).toContain("useGetBranch(effectiveBranchId)");
    expect(details).toContain("useGetBranch(branchId)");
    expect(details).toContain("useGetBranchHolidayOpeningHours");
    expect(edit).toContain("buildBranchPatchPayload");
    expect(edit).toContain("updateBranchNotificationSettings");
    expect(edit).toContain("useUpdateBranchDeliveryTime");
    expect(edit).toContain("requestedBranchId !== authBranchId");
  });
});
