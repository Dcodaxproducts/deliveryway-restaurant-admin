import { beforeEach, describe, expect, it, vi } from "vitest";

import { httpClient } from "@/lib/axios";
import { refundPaymentTransaction, updateOrderStatus } from "@/services/orders";

vi.mock("@/lib/axios", () => ({
  default: {
    get: vi.fn(),
  },
  httpClient: {
    patch: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedPatch = vi.mocked(httpClient.patch);
const mockedPost = vi.mocked(httpClient.post);

const orderResponse = {
  data: {
    id: "order-1",
    orderNumber: "1001",
    orderType: "DELIVERY",
    status: "PLACED",
    totalAmount: 25,
    createdAt: "2026-06-02T10:00:00.000Z",
  },
};

describe("orders service", () => {
  beforeEach(() => {
    mockedPatch.mockReset();
    mockedPost.mockReset();
  });

  it("updateOrderStatus calls /orders/:id/status without duplicating /api/v1", async () => {
    mockedPatch.mockResolvedValue(orderResponse);

    await updateOrderStatus("order-1", { status: "PLACED" });

    expect(mockedPatch).toHaveBeenCalledWith("/orders/order-1/status", {
      status: "PLACED",
    });
    expect(mockedPatch.mock.calls[0]?.[0]).not.toContain("/api/v1");
  });

  it("omits empty deliveryOtp", async () => {
    mockedPatch.mockResolvedValue(orderResponse);

    await updateOrderStatus("order-1", {
      status: "CONFIRMED",
      deliveryOtp: "   ",
    });

    expect(mockedPatch).toHaveBeenCalledWith("/orders/order-1/status", {
      status: "CONFIRMED",
    });
  });

  it("sends deliveryOtp when provided", async () => {
    mockedPatch.mockResolvedValue(orderResponse);

    await updateOrderStatus("order-1", {
      status: "OUT_FOR_DELIVERY",
      deliveryOtp: "1234",
    });

    expect(mockedPatch).toHaveBeenCalledWith("/orders/order-1/status", {
      status: "OUT_FOR_DELIVERY",
      deliveryOtp: "1234",
    });
  });

  it("sends orderTime when accepting an order", async () => {
    mockedPatch.mockResolvedValue(orderResponse);

    await updateOrderStatus("order-1", {
      status: "CONFIRMED",
      orderTime: "2026-06-09T12:30:00.000Z",
    });

    expect(mockedPatch).toHaveBeenCalledWith("/orders/order-1/status", {
      status: "CONFIRMED",
      orderTime: "2026-06-09T12:30:00.000Z",
    });
  });

  it("refundPaymentTransaction calls the payment refund endpoint", async () => {
    mockedPost.mockResolvedValue({ data: { id: "refund-1" } });

    await refundPaymentTransaction("payment-1", { note: "Customer refund" });

    expect(mockedPost).toHaveBeenCalledWith("/payments/payment-1/refund", {
      note: "Customer refund",
    });
  });
});
