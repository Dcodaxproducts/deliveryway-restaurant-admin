import { describe, expect, it } from "vitest";

import { editBranchSchema } from "@/components/pages/branches/forms/EditBranchForm/edit-branch.schema";

const validEditBranchPayload = {
  name: "Blue Area",
  branchAdmin: {
    email: "branch@example.com",
    firstName: "Ali",
    lastName: "Khan",
    phone: "+923001234567",
    password: "",
  },
};

describe("edit branch schema", () => {
  it("accepts valid branch admin email", () => {
    const result = editBranchSchema.safeParse(validEditBranchPayload);

    expect(result.success).toBe(true);
  });

  it("rejects invalid branch admin email", () => {
    const result = editBranchSchema.safeParse({
      ...validEditBranchPayload,
      branchAdmin: {
        ...validEditBranchPayload.branchAdmin,
        email: "not-an-email",
      },
    });

    expect(result.success).toBe(false);
  });

  it("does not require password while editing", () => {
    const result = editBranchSchema.safeParse({
      ...validEditBranchPayload,
      branchAdmin: {
        ...validEditBranchPayload.branchAdmin,
        password: undefined,
      },
    });

    expect(result.success).toBe(true);
  });

  it("allows an empty password while editing", () => {
    const result = editBranchSchema.safeParse({
      ...validEditBranchPayload,
      branchAdmin: {
        ...validEditBranchPayload.branchAdmin,
        password: "",
      },
    });

    expect(result.success).toBe(true);
  });

  it("rejects a short password when a new password is entered", () => {
    const result = editBranchSchema.safeParse({
      ...validEditBranchPayload,
      branchAdmin: {
        ...validEditBranchPayload.branchAdmin,
        password: "short",
      },
    });

    expect(result.success).toBe(false);
  });
});
