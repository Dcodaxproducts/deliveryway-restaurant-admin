import { beforeEach, describe, expect, it, vi } from "vitest";

import api, { httpClient } from "@/lib/axios";
import {
  failPaymentTransaction,
  getOrders,
  markPaymentTransactionPaid,
  normalizeOrder,
  refundPaymentTransaction,
  updatePaymentTransactionStatus,
  updateOrderStatus,
} from "@/services/orders";

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
const mockedGet = vi.mocked(api.get);

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
    mockedGet.mockReset();
    mockedPatch.mockReset();
    mockedPost.mockReset();
  });

  it("omits orderType when fetching the all orders tab", async () => {
    mockedGet.mockResolvedValue({
      data: {
        data: [],
        meta: null,
        success: true,
      },
    });

    await getOrders({
      restaurantId: "restaurant-1",
      page: 1,
      limit: 10,
      kind: "order",
    });

    expect(mockedGet).toHaveBeenCalledWith("/orders", {
      params: {
        restaurantId: "restaurant-1",
        page: 1,
        limit: 10,
        kind: "order",
      },
    });
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

  it("sends external delivery fulfillment mode when requested", async () => {
    mockedPatch.mockResolvedValue(orderResponse);

    await updateOrderStatus("order-1", {
      status: "OUT_FOR_DELIVERY",
      deliveryFulfillmentMode: "EXTERNAL",
    });

    expect(mockedPatch).toHaveBeenCalledWith("/orders/order-1/status", {
      status: "OUT_FOR_DELIVERY",
      deliveryFulfillmentMode: "EXTERNAL",
    });
  });

  it("normalizes scheduled order fields from list responses", () => {
    const order = normalizeOrder({
      ...orderResponse.data,
      orderTime: "2026-06-20T12:30:00.000Z",
      isScheduled: true,
    });

    expect(order?.orderTime).toBe("2026-06-20T12:30:00.000Z");
    expect(order?.isScheduled).toBe(true);
  });

  it("normalizes payment transactions from list responses", () => {
    const order = normalizeOrder({
      ...orderResponse.data,
      paymentStatus: "PENDING",
      transactions: [
        {
          id: "payment-1",
          type: "CHARGE",
          status: "PENDING",
          amount: 25,
          currency: "USD",
        },
      ],
    });

    expect(order?.paymentStatus).toBe("PENDING");
    expect(order?.transactions).toEqual([
      {
        id: "payment-1",
        paymentMethod: null,
        type: "CHARGE",
        status: "PENDING",
        amount: 25,
        currency: "USD",
        providerRef: null,
        note: null,
        processedAt: null,
        createdAt: null,
      },
    ]);
  });

  it("refundPaymentTransaction calls the payment refund endpoint", async () => {
    mockedPost.mockResolvedValue({ data: { id: "refund-1" } });

    await refundPaymentTransaction("payment-1", {
      amount: 12.5,
      note: "Customer refund",
    });

    expect(mockedPost).toHaveBeenCalledWith("/payments/payment-1/refund", {
      amount: 12.5,
      note: "Customer refund",
    });
  });

  it("markPaymentTransactionPaid calls the admin mark-paid endpoint", async () => {
    mockedPost.mockResolvedValue({ data: { id: "payment-1" } });

    await markPaymentTransactionPaid("payment-1", {
      note: "Cash collected at counter",
    });

    expect(mockedPost).toHaveBeenCalledWith("/payments/payment-1/mark-paid", {
      note: "Cash collected at counter",
    });
  });

  it("failPaymentTransaction calls the admin fail endpoint", async () => {
    mockedPost.mockResolvedValue({ data: { id: "payment-1" } });

    await failPaymentTransaction("payment-1", {
      note: "Payment could not be collected",
    });

    expect(mockedPost).toHaveBeenCalledWith("/payments/payment-1/fail", {
      note: "Payment could not be collected",
    });
  });

  it("updatePaymentTransactionStatus calls the admin status endpoint", async () => {
    mockedPatch.mockResolvedValue({ data: { id: "payment-1" } });

    await updatePaymentTransactionStatus("payment-1", {
      status: "CANCELLED",
      note: "Cancelled by admin",
    });

    expect(mockedPatch).toHaveBeenCalledWith("/payments/payment-1/status", {
      status: "CANCELLED",
      note: "Cancelled by admin",
    });
  });
});
