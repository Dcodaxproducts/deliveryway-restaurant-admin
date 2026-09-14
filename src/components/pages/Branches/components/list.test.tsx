import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { AbstractIntlMessages } from "next-intl";

import en from "@/messages/en.json";
import BranchesList, { formatBranchAddress } from "./list";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("next-intl", async (importOriginal) => {
  const original = await importOriginal<typeof import("next-intl")>();
  return {
    ...original,
    useTranslations: (namespace: string) =>
      original.createTranslator({
        locale: "en",
        messages: en as AbstractIntlMessages,
        namespace,
        onError: (error) => {
          throw error;
        },
      }),
  };
});
vi.mock("@/components/cards/BranchCard", () => ({ BranchCard: () => null }));
vi.mock("@/components/common/ResponsiveDataView", () => ({
  ResponsiveDataView: ({ data, columns }: {
    data: Array<Record<string, unknown>>;
    columns: Array<{ id: string; cell: (row: Record<string, unknown>) => React.ReactNode }>;
  }) => (
    <div>
      {columns.map((column) => (
        <div key={column.id}>{column.cell(data[0])}</div>
      ))}
    </div>
  ),
}));

describe("BranchesList staging regressions", () => {
  it("formats the structured address returned by the branches API", () => {
    expect(
      formatBranchAddress({
        street: "Market Street",
        shopNumber: "12A",
        postalCode: "94105",
        city: "San Francisco",
        state: "California",
        country: "USA",
      }),
    ).toBe("Market Street 12A, 94105 San Francisco, California, USA");
  });

  it("renders a main branch with a structured address and localized label", () => {
    const markup = renderToStaticMarkup(
      <BranchesList
        branches={[
          {
            id: "branch-1",
            name: "Downtown",
            isMain: true,
            address: {
              street: "Market Street",
              shopNumber: "12A",
              postalCode: "94105",
              city: "San Francisco",
            },
          },
        ]}
      />,
    );

    expect(markup).toContain("Main Branch");
    expect(markup).toContain("Market Street 12A, 94105 San Francisco");
    expect(markup).not.toContain("[object Object]");
  });
});
