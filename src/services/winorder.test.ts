import { beforeEach, describe, expect, it, vi } from "vitest";
import { httpClient } from "@/lib/axios";
import {
  createWinOrderConnection,
  getWinOrderConnection,
  replaceWinOrderCatalogMappings,
  rotateWinOrderCredentials,
} from "@/services/winorder";

vi.mock("@/lib/axios", () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe("WinOrder service", () => {
  beforeEach(() => {
    vi.mocked(httpClient.get).mockReset();
    vi.mocked(httpClient.post).mockReset();
    vi.mocked(httpClient.patch).mockReset();
  });

  it("uses branch-scoped connection endpoints", async () => {
    vi.mocked(httpClient.get).mockResolvedValueOnce({
      data: null,
      message: "ok",
    });
    vi.mocked(httpClient.post).mockResolvedValue({ data: {}, message: "ok" });

    await getWinOrderConnection("branch-1");
    await createWinOrderConnection({ branchId: "branch-1", storeId: 4 });
    await rotateWinOrderCredentials("branch-1");

    expect(httpClient.get).toHaveBeenCalledWith(
      "/admin/integrations/winorder/connections/branch-1",
    );
    expect(httpClient.post).toHaveBeenNthCalledWith(
      1,
      "/admin/integrations/winorder/connections",
      { branchId: "branch-1", storeId: 4 },
    );
    expect(httpClient.post).toHaveBeenNthCalledWith(
      2,
      "/admin/integrations/winorder/connections/branch-1/rotate",
    );
  });

  it("sends deterministic catalog mapping payloads", async () => {
    vi.mocked(httpClient.patch).mockResolvedValueOnce({
      data: {},
      message: "ok",
    });
    const mappings = [
      {
        mappingType: "ITEM" as const,
        localKey: "item:item-1:base",
        externalArticleNo: "P1",
        externalArticleName: "Pizza",
      },
    ];

    await replaceWinOrderCatalogMappings("branch-1", mappings);

    expect(httpClient.patch).toHaveBeenCalledWith(
      "/admin/integrations/winorder/mappings/branch-1/catalog",
      { mappings },
    );
  });
});
