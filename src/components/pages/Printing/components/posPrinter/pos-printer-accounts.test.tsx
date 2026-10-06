import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AbstractIntlMessages } from "next-intl";

import PosPrinterLoginPage from "@/components/pages/Auth/PosPrinterLoginPage";
import PosPrinterAccounts from "@/components/pages/Printing/components/posPrinter/PosPrinterAccounts";
import { PosPrinterAccountCreateForm } from "@/components/pages/Printing/components/posPrinter/PosPrinterAccountCreateForm";
import de from "@/messages/de.json";
import en from "@/messages/en.json";
import type { AuthUser } from "@/lib/auth";
import type { PosPrinterAccount } from "@/services/pos-printer";

const harness = vi.hoisted(() => ({
  locale: "en" as "en" | "de",
  auth: {
    role: "BUSINESS_ADMIN" as string,
    branchId: undefined as string | undefined,
    user: { id: "admin", email: "admin@example.com", role: "BUSINESS_ADMIN", profile: {} } as AuthUser,
  },
  accounts: { data: undefined as PosPrinterAccount[] | undefined, isPending: false, isError: false, refetch: vi.fn() },
  branches: { data: [{ id: "b1", name: "Main branch" }], isPending: false, isError: false },
}));

// Real message interpolation with fail-fast errors so missing EN/DE keys break the test.
vi.mock("next-intl", async (importOriginal) => {
  const original = await importOriginal<typeof import("next-intl")>();
  return {
    ...original,
    useTranslations: (namespace: string) =>
      original.createTranslator({
        locale: harness.locale,
        messages: (harness.locale === "en" ? en : de) as AbstractIntlMessages,
        namespace,
        onError: (error) => {
          throw error;
        },
      }),
  };
});
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), push: vi.fn() }), usePathname: () => "/" }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/components/providers/auth-provider", () => ({ useAuthContext: () => ({ login: vi.fn() }) }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => harness.auth }));
vi.mock("@tanstack/react-query", () => ({ useQuery: () => harness.branches }));
vi.mock("@/services/branches", () => ({ getBranches: vi.fn() }));
vi.mock("@/hooks/usePosPrinterAccounts", () => ({
  usePosPrinterAccounts: () => harness.accounts,
  useCreatePosPrinterAccount: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdatePosPrinterStatus: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useResetPosPrinterPassword: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

const usernameAccount: PosPrinterAccount = {
  id: "p1", username: "kitchen-1", displayName: "Kitchen Printer",
  email: "kitchen-1@pos-printer.feastflow.local", firstName: "Kitchen", lastName: "Printer",
  branchId: "b1", branch: { id: "b1", name: "Main branch" }, isActive: true,
};
const legacyAccount: PosPrinterAccount = {
  id: "p2", username: null, displayName: "Legacy Device", email: "legacy@example.com",
  firstName: "Legacy", lastName: "Device", branchId: "b1", branch: null, isActive: false,
};

const countMatches = (markup: string, pattern: RegExp) => (markup.match(pattern) ?? []).length;
// React keeps camelCase attribute names in static markup; browsers treat them case-insensitively.
const inputs = (markup: string) => (markup.match(/<input\b[^>]*>/g) ?? []).map((input) => input.toLowerCase());

const renderCreateForm = (requiresBranchSelection: boolean) =>
  renderToStaticMarkup(
    <PosPrinterAccountCreateForm
      formId="create"
      requiresBranchSelection={requiresBranchSelection}
      fixedBranchName="Central"
      branches={{ options: [{ id: "b1", name: "Main branch" }], isPending: false, isError: false }}
      onSubmit={vi.fn()}
      onError={vi.fn()}
    />
  );

beforeEach(() => {
  vi.clearAllMocks();
  harness.locale = "en";
  harness.auth = {
    role: "BUSINESS_ADMIN",
    branchId: undefined,
    user: { id: "admin", email: "admin@example.com", role: "BUSINESS_ADMIN", profile: {} },
  };
  harness.accounts = { data: [usernameAccount, legacyAccount], isPending: false, isError: false, refetch: vi.fn() };
});

describe("POS printer account creation form", () => {
  it("collects display name, username, initial password, and branch only", () => {
    const markup = renderCreateForm(true);

    for (const label of ["Display name", "Username", "Initial password", "Branch"]) {
      expect(markup).toContain(`>${label}<`);
    }
    for (const legacy of ["First name", "Last name", ">Email<", 'type="email"', 'name="firstName"', 'name="lastName"']) {
      expect(markup).not.toContain(legacy);
    }
    expect(inputs(markup)).toHaveLength(3);
    // Business admins get the shared FormSelect (combobox trigger + hidden native select).
    expect(markup).toContain('role="combobox"');
    expect(markup).toContain('aria-required="true"');
    expect(markup).toContain('name="branchId"');
    expect(markup).not.toContain("Central");
  });

  it("hardens the username input for device keyboards and explains the rules", () => {
    const markup = renderCreateForm(true);
    const username = inputs(markup).find((input) => input.includes('name="username"'));

    expect(username).toBeDefined();
    expect(username).toContain('autocapitalize="none"');
    expect(username).toContain('autocorrect="off"');
    expect(username).toContain('spellcheck="false"');
    expect(username).toContain('maxlength="32"');
    expect(username).toContain('aria-describedby="create-username-help"');
    expect(markup).toContain("3–32 characters: lowercase letters, numbers, dots, underscores, or hyphens.");
    const password = inputs(markup).find((input) => input.includes('type="password"'));
    expect(password).toContain('autocomplete="new-password"');
    expect(password).toContain('minlength="12"');
  });

  it("shows the fixed branch read-only for branch admins instead of a selector", () => {
    const markup = renderCreateForm(false);

    expect(markup).not.toContain('role="combobox"');
    expect(markup).not.toContain('name="branchId"');
    const branch = inputs(markup).find((input) => input.includes('value="central"'));
    expect(branch).toBeDefined();
    expect(branch).toContain('readonly=""');
    expect(branch).toContain('aria-readonly="true"');
    expect(markup).toContain(">Branch<");
  });

  it("translates the primary fields into German", () => {
    harness.locale = "de";
    const markup = renderCreateForm(true);

    for (const label of ["Anzeigename", "Benutzername", "Initialpasswort", "Filiale"]) {
      expect(markup).toContain(`>${label}<`);
    }
    expect(markup).not.toContain("Vorname");
    expect(markup).not.toContain("Nachname");
  });
});

describe("POS printer account list", () => {
  it("shows the display name and the sign-in identifier for username and legacy accounts", () => {
    const markup = renderToStaticMarkup(<PosPrinterAccounts />);

    expect(markup).toContain(">Kitchen Printer<");
    expect(markup).toContain(">kitchen-1<");
    expect(markup).not.toContain("pos-printer.feastflow.local");
    expect(markup).toContain(">Legacy Device<");
    expect(markup).toContain(">legacy@example.com<");
    expect(countMatches(markup, /<dt[^>]*>Username<\/dt>/g)).toBe(1);
    expect(countMatches(markup, /<dt[^>]*>Email<\/dt>/g)).toBe(1);
    expect(markup).toContain(">Active<");
    expect(markup).toContain(">Inactive<");
    expect(markup).toContain('aria-label="POS printer account list"');
    expect(markup).toContain('aria-describedby="pos-printer-account-p1-title"');
  });

  it("renders the branch-scoped banner for branch admins and stacks the header on small screens", () => {
    harness.auth = {
      role: "BRANCH_ADMIN",
      branchId: "b1",
      user: { id: "branch", email: "branch@example.com", role: "BRANCH_ADMIN", branchName: "Central", profile: {} },
    };
    const markup = renderToStaticMarkup(<PosPrinterAccounts />);

    expect(markup).toContain("Accounts are restricted to your assigned branch: Central");
    expect(markup).toContain("flex-col gap-4 sm:flex-row");
    expect(markup).toContain("w-full sm:w-auto");
  });

  it("keeps empty, loading, and error states accessible", () => {
    harness.accounts = { data: [], isPending: false, isError: false, refetch: vi.fn() };
    expect(renderToStaticMarkup(<PosPrinterAccounts />)).toContain("No POS printer accounts have been created yet.");

    harness.accounts = { data: undefined, isPending: true, isError: false, refetch: vi.fn() };
    expect(renderToStaticMarkup(<PosPrinterAccounts />)).toContain('role="status" aria-label="Loading POS printer accounts"');

    harness.accounts = { data: undefined, isPending: false, isError: true, refetch: vi.fn() };
    const markup = renderToStaticMarkup(<PosPrinterAccounts />);
    expect(markup).toContain('role="alert"');
    expect(markup).toContain("POS printer accounts could not be loaded.");
  });

  it("renders nothing for accounts without admin scope", () => {
    harness.auth = {
      role: "STAFF",
      branchId: undefined,
      user: { id: "staff", email: "staff@example.com", role: "STAFF", actorType: "STAFF", profile: {} },
    };
    expect(renderToStaticMarkup(<PosPrinterAccounts />)).toBe("");
  });

  it("lets scoped staff read accounts without exposing create or update controls", () => {
    harness.auth = {
      role: "STAFF",
      branchId: "b1",
      user: {
        id: "staff", email: "staff@example.com", role: "STAFF", actorType: "STAFF",
        tenantId: "t1", restaurantId: "r1", branchId: "b1", profile: {},
        staffRole: {
          tenantId: "t1", restaurantId: "r1", branchId: "b1",
          permissions: [{ access: "auto-printing-pos", operations: ["read"] }],
        },
      },
    };

    const markup = renderToStaticMarkup(<PosPrinterAccounts />);
    expect(markup).toContain(">Kitchen Printer<");
    expect(markup).not.toContain(">Create account<");
    expect(markup).not.toContain(">Reset password<");
    expect(markup).not.toContain(">Deactivate<");
  });

  it("shows account creation to scoped staff with create permission", () => {
    harness.auth = {
      role: "STAFF",
      branchId: "b1",
      user: {
        id: "staff", email: "staff@example.com", role: "STAFF", actorType: "STAFF",
        tenantId: "t1", restaurantId: "r1", branchId: "b1", profile: {},
        staffRole: {
          tenantId: "t1", restaurantId: "r1", branchId: "b1",
          permissions: [{ access: "auto-printing-pos", operations: ["create"] }],
        },
      },
    };

    expect(renderToStaticMarkup(<PosPrinterAccounts />)).toContain(">Create account<");
  });
});

describe("POS printer login page", () => {
  it("uses one identifier field for username or email plus a password and no role selector", () => {
    const markup = renderToStaticMarkup(<PosPrinterLoginPage />);
    const fields = inputs(markup);

    expect(fields).toHaveLength(2);
    expect(markup).toContain(">Username or email<");
    expect(fields[0]).toContain('autocomplete="username"');
    expect(fields[0]).toContain('type="text"');
    expect(fields[0]).toContain('autocapitalize="none"');
    expect(fields[0]).toContain('placeholder="kitchen-printer or printer@restaurant.com"');
    expect(fields[1]).toContain('type="password"');
    expect(fields[1]).toContain('autocomplete="current-password"');
    expect(markup).not.toContain('type="email"');
    // The only toggle is the password visibility button; the admin role picker is absent.
    expect(countMatches(markup, /aria-pressed/g)).toBe(1);
    expect(markup).toContain('aria-label="Show password"');
    expect(markup).not.toContain("<fieldset");
    expect(markup).not.toContain("Log in as");
    expect(markup).not.toContain('name="role"');
    expect(markup).toContain('aria-labelledby="pos-printer-login-title"');
    expect(markup).toContain('href="/login"');
  });

  it("translates the identifier field into German", () => {
    harness.locale = "de";
    const markup = renderToStaticMarkup(<PosPrinterLoginPage />);

    expect(markup).toContain(">Benutzername oder E-Mail<");
    expect(markup).toContain("Melden Sie sich mit dem Benutzernamen oder der E-Mail");
    expect(markup).not.toContain("Anmelden als");
  });
});
