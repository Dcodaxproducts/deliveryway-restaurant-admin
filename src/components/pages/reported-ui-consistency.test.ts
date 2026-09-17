import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (relativePath: string) =>
  readFileSync(new URL(relativePath, import.meta.url), "utf8");

describe("reported partner UI consistency", () => {
  it("uses the shared Contact Submissions controls and useful reply placeholders", () => {
    const source = read(
      "./ContactSubmissions/pages/ContactSubmissionsPage.tsx",
    );

    expect(source).toContain("<SearchField");
    expect(source).toContain('placeholder="Reply subject"');
    expect(source).toContain('placeholder="Write your reply"');
    expect(source).not.toContain('className="relative"');
  });

  it("uses 1/2/4 metric layouts on loyalty, deliverymen, and employees", () => {
    const loyaltyProgram = read(
      "./Loyalty/components/loyalty/LoyaltyProgramSettings.tsx",
    );
    const customerLoyalty = read(
      "./Loyalty/components/loyalty/CustomerLoyaltyManager.tsx",
    );
    const deliverymen = read(
      "./Deliverymen/components/deliveryman/stats-section.tsx",
    );
    const employees = read(
      "./Employees/components/employee-settings/stats-section.tsx",
    );

    expect(loyaltyProgram).toContain(
      "grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4",
    );
    expect(customerLoyalty).toContain(
      "grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4",
    );
    expect(deliverymen).toContain("columns={4}");
    expect(employees).toContain("columns={4}");
  });

  it("adds placeholders to the reported admin forms", () => {
    const deliveryman = read("./Deliverymen/forms/DeliverymanForm.tsx");
    const employee = read(
      "./Employees/components/employee-settings/AddEmployeeModal.tsx",
    );

    expect(deliveryman).toContain("placeholder={label}");
    expect(employee).toContain("placeholder={label}");
  });
});
